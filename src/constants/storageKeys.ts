/**
 * Single source of truth for every localStorage / Zustand-persist key the
 * app writes. Keeping them here avoids:
 *   - typos that silently orphan user data (one "cruzer:setings" instead of
 *     "cruzer:settings" = lost preferences on next launch)
 *   - collisions between unrelated modules choosing the same string
 *   - broken migrations (bumping a version number in only half the call sites)
 *
 * Namespace convention:
 *   cruzer:<domain>         → ephemeral / session-scoped OAuth state
 *   cruzer.<domain>         → legacy flat keys (kept as-is so persisted
 *                             user data from prior versions still loads)
 *   cruzer:<domain>_<vN>    → cache keys that carry a version suffix
 */

// --- OAuth (transient, cleared on redirect-back) -----------------------------
export const SK_OAUTH_STATE = "cruzer:oauth_state";
export const SK_PKCE_VERIFIER = "cruzer:pkce_verifier";

// --- Boot / first-launch gate -----------------------------------------------
export const SK_BOOTED = "cruzer:booted";

// --- Zustand-persist stores -------------------------------------------------
export const SK_SETTINGS = "cruzer:settings";
export const SK_CHARACTER = "cruzer:character";
export const SK_TAGS = "cruzer:tags";
// Legacy flat keys — kept with the dot form so existing user data survives.
export const SK_PLATFORM = "cruzer.platform";
export const SK_AUTH_CHARACTER = "cruzer.character";
export const SK_BUILDS = "cruzer.builds";

// --- Manifest cache (carries version suffix) --------------------------------
export const SK_MANIFEST_LIGHT = "cruzer:manifest_light_v6";