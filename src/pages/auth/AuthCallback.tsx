/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { exchangeCodeForToken } from "@/api/oauth"
import { useAuthStore } from "@/store/auth"

export function AuthCallback() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const [error, setError] = useState<string | null>(null)
  // Guard against React StrictMode double-mount and any other re-runs:
  // the auth code is single-use, exchanging it twice fails with AuthorizationCodeInvalid.
  const exchanged = useRef(false)

  useEffect(() => {
    if (exchanged.current) return
    exchanged.current = true

    const code = params.get("code")
    const state = params.get("state")
    if (!code || !state) {
      setError("Missing code or state in callback URL")
      return
    }

    exchangeCodeForToken(code, state)
      .then((tok) => {
        setTokens({
          accessToken: tok.access_token,
          refreshToken: tok.refresh_token,
          expiresIn: tok.expires_in,
          membershipId: tok.membership_id,
        })
        navigate("/", { replace: true })
      })
      .catch((e: Error) => setError(e.message))
  }, [params, navigate, setTokens])

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="panel max-w-2xl space-y-2 p-8 text-center">
        {error ? (
          <>
            <p className="font-semibold text-red-400">{t("auth.error")}</p>
            <p className="text-bungie-muted text-sm break-all">{error}</p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="btn-primary mt-4"
            >
              {t("common.retry")}
            </button>
          </>
        ) : (
          <p>{t("auth.connecting")}</p>
        )}
      </div>
    </div>
  )
}
