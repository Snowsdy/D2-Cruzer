// Bungie OAuth 2.0 with PKCE (public client flow — no client_secret needed)
// Token exchange runs in Rust (via Tauri commands) so the webview's Origin
// header isn't sent to Bungie (which would cause OriginHeaderDoesNotMatchKey).
import { trackedInvoke } from "@/lib/tauri"
import { SK_OAUTH_STATE, SK_PKCE_VERIFIER } from "@/constants/storageKeys"

const AUTH_URL = "https://www.bungie.net/en/OAuth/Authorize"

const CLIENT_ID = import.meta.env.VITE_BUNGIE_CLIENT_ID as string
const REDIRECT_URI = import.meta.env.VITE_BUNGIE_REDIRECT_URI as string

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return new Uint8Array(hash)
}

export async function startAuthFlow(): Promise<string> {
  const verifierBytes = new Uint8Array(32)
  crypto.getRandomValues(verifierBytes)
  const verifier = base64url(verifierBytes)
  const challenge = base64url(await sha256(verifier))

  const state = base64url(crypto.getRandomValues(new Uint8Array(16)))

  localStorage.setItem(SK_PKCE_VERIFIER, verifier)
  localStorage.setItem(SK_OAUTH_STATE, state)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  })

  return `${AUTH_URL}?${params.toString()}`
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string | null
  refresh_expires_in: number | null
  membership_id: string
}

type RustTokenResponse = TokenResponse

interface RustOAuthError {
  status: number
  body: string
}

export async function exchangeCodeForToken(
  code: string,
  state: string
): Promise<TokenResponse> {
  const storedState = localStorage.getItem(SK_OAUTH_STATE)
  const verifier = localStorage.getItem(SK_PKCE_VERIFIER)
  if (state !== storedState) throw new Error("OAuth state mismatch")
  if (!verifier) throw new Error("Missing PKCE verifier")

  try {
    const tok = await trackedInvoke<RustTokenResponse>("bungie_exchange_code", {
      code,
      codeVerifier: verifier,
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
    })
    localStorage.removeItem(SK_PKCE_VERIFIER)
    localStorage.removeItem(SK_OAUTH_STATE)
    return tok
  } catch (e) {
    const err = e as RustOAuthError | string
    if (typeof err === "object" && err !== null && "status" in err) {
      throw new Error(`Token exchange failed: ${err.status} ${err.body}`)
    }
    throw new Error(`Token exchange failed: ${String(err)}`)
  }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  try {
    return await trackedInvoke<RustTokenResponse>("bungie_refresh_token", {
      refreshToken,
      clientId: CLIENT_ID,
    })
  } catch (e) {
    const err = e as RustOAuthError | string
    if (typeof err === "object" && err !== null && "status" in err) {
      throw new Error(`Refresh failed: ${err.status} ${err.body}`)
    }
    throw new Error(`Refresh failed: ${String(err)}`)
  }
}
