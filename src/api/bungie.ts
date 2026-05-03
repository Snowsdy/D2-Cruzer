/* eslint-disable @typescript-eslint/no-explicit-any */
// Bungie API client — all calls go through Rust to avoid Origin header issues.
import { trackedInvoke } from "@/lib/tauri"
import { useAuthStore } from "@/store/auth"
import { refreshAccessToken } from "./oauth"

const API_KEY = import.meta.env.VITE_BUNGIE_API_KEY as string

interface BungieErrorPayload {
  status: number
  error_code: number | null
  message: string
}

export interface BungieApiError extends Error {
  name: "BungieApiError"
  status: number
  errorCode: number | null
  message: string
}

export function isABungieApiError(obj: any): obj is BungieApiError {
  return "status" in obj && "errorCode" in obj && "message" in obj
}

// Single-flight token refresh — if multiple calls need a new token at the
// same time, they share a single refresh request instead of stampeding.
let pendingRefresh: Promise<string | null> | null = null

async function refreshNow(): Promise<string | null> {
  const { refreshToken, setTokens } = useAuthStore.getState()
  if (!refreshToken) {
    // No refresh token — return null but keep the session in place so the
    // user decides when to log out manually.
    return null
  }
  try {
    const t = await refreshAccessToken(refreshToken)
    setTokens({
      accessToken: t.access_token,
      refreshToken: t.refresh_token,
      expiresIn: t.expires_in,
      membershipId: t.membership_id,
    })
    return t.access_token
  } catch (e) {
    // Refresh failed (network down, Bungie.net outage, revoked token…).
    // Do NOT auto-clear the session — let the user retry or log out manually.
    // Log just the error message (never the token or full error object) to
    // avoid accidentally emitting refresh-token material to any attached
    // log sink.
    const msg = e instanceof Error ? e.message : String(e)
    console.warn("[auth] token refresh failed:", msg)
    return null
  }
}

async function ensureFreshToken(force = false): Promise<string | null> {
  const { accessToken, isExpired } = useAuthStore.getState()
  if (!accessToken && !force) return null
  if (!force && !isExpired()) return accessToken
  if (!pendingRefresh)
    pendingRefresh = refreshNow().finally(() => {
      pendingRefresh = null
    })
  return pendingRefresh
}

function isAuthError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false
  const e = err as BungieErrorPayload
  if (e.status === 401) return true
  // Bungie error codes for auth/token issues.
  if (e.error_code === 99 || e.error_code === 2111 || e.error_code === 2110)
    return true
  return false
}

export async function bungieGet<T = unknown>(
  path: string,
  { auth = true }: { auth?: boolean } = {}
): Promise<T> {
  const accessToken = auth ? await ensureFreshToken() : null
  try {
    return await trackedInvoke<T>("bungie_get", {
      apiKey: API_KEY,
      accessToken,
      path,
    })
  } catch (e) {
    // If the server says the token is bad, force-refresh and retry up to
    // two more times — transient Bungie issues sometimes reject an otherwise
    // valid token, and we don't want the user to see a disconnect flash.
    if (auth && isAuthError(e)) {
      let refreshFailed = false
      for (let attempt = 0; attempt < 2; attempt++) {
        const fresh = await ensureFreshToken(true)
        if (!fresh) {
          // No fresh token could be obtained — refresh_token itself is dead.
          refreshFailed = true
          break
        }
        try {
          return await trackedInvoke<T>("bungie_get", {
            apiKey: API_KEY,
            accessToken: fresh,
            path,
          })
        } catch (retryErr) {
          if (!isAuthError(retryErr)) break
          // brief backoff before the second attempt
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
        }
      }
      // Refresh cycle exhausted and the error is still auth-related → the
      // session is effectively dead. Clearing the auth store triggers
      // RequireAuth (App.tsx) to redirect to /login on the next render.
      if (refreshFailed || isAuthError(e)) {
        useAuthStore.getState().clear()
      }
    }
    const err = e as BungieErrorPayload | string
    const error: BungieApiError = {
      status: 0,
      errorCode: null,
      message: String(err),
      name: "BungieApiError",
    }
    if (typeof err === "object" && err !== null && "status" in err) {
      error.status = err.status
      error.errorCode = err.error_code
      error.message = err.message
      throw error
    }
    throw error
  }
}

export const BungieApi = {
  getCurrentUserMemberships: () =>
    bungieGet<unknown>("/User/GetMembershipsForCurrentUser/"),

  getProfile: (
    membershipType: number,
    membershipId: string,
    components: number[]
  ) =>
    bungieGet<unknown>(
      `/Destiny2/${membershipType}/Profile/${membershipId}/?components=${components.join(",")}`
    ),

  getManifest: () => bungieGet<unknown>("/Destiny2/Manifest/", { auth: false }),
}
