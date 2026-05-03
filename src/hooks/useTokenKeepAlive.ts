import { useEffect } from "react"
import { useAuthStore } from "@/store/auth"
import { refreshAccessToken } from "@/api/oauth"

/**
 * Runs a background timer that proactively refreshes the Bungie access token
 * well before it expires. Prevents the common "error 99 — please sign-in"
 * blip that happens when an idle session's token silently dies.
 *
 * Strategy:
 *   - every 60s, check how long until the access token expires
 *   - if it's within the next 6 minutes, trigger a refresh
 *   - on success, the auth store is updated with the new tokens
 *   - on failure (e.g. revoked refresh_token), stay silent — the next actual
 *     API call will surface the error in context rather than a nag
 */
export function useTokenKeepAlive() {
  useEffect(() => {
    let stopped = false
    let refreshing = false

    const tick = async () => {
      if (stopped || refreshing) return
      const { accessToken, refreshToken, expiresAt } = useAuthStore.getState()
      if (!accessToken || !refreshToken || !expiresAt) return
      const msLeft = expiresAt - Date.now()
      // Refresh window: 6 min before expiry. With a 60s tick this catches the
      // token between t-6min and t-5min, well before any request gets 401.
      if (msLeft > 6 * 60_000) return

      refreshing = true
      try {
        const t = await refreshAccessToken(refreshToken)
        useAuthStore.getState().setTokens({
          accessToken: t.access_token,
          refreshToken: t.refresh_token,
          expiresIn: t.expires_in,
          membershipId: t.membership_id,
        })
      } catch (e) {
        // Stay on the page — the user isn't forced out. The next API call
        // will handle the hard failure case.
        console.warn("[auth] background keep-alive refresh failed:", e)
      } finally {
        refreshing = false
      }
    }

    // Kick once on mount so a stale session gets a fresh token immediately.
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => {
      stopped = true
      window.clearInterval(id)
    }
  }, [])
}
