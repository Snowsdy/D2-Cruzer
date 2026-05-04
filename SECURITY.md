# Security
This document describes the threat model, hardening decisions, and known
residual limits for **Cruzer Compagnon**. It is kept in the repo root so
both contributors and security researchers can reach it without digging.

## Supported versions
Only the latest `0.1.x` is supported. Downgrades are not patched; upgrade
to the most recent release before reporting an issue.

## Reporting a vulnerability
If you find a security issue, please **do not open a public GitHub issue**.
Instead, contact the maintainer privately (see the repo's `README.md` for
the current contact address) with:

- a clear description of the problem,
- a proof-of-concept or reproduction steps,
- the app version + OS you observed it on.

We'll acknowledge within 5 business days and coordinate a fix + disclosure
timeline.

## Threat model
Cruzer Compagnon is a **single-user desktop companion** for Destiny 2. It
runs locally, authenticates against Bungie.net via OAuth 2.0 (PKCE), and
fetches the user's own profile data. It does **not** operate a backend,
does not receive traffic from other users, and does not relay data.

The realistic threats we defend against:

1. **XSS** through third-party HTML we render (Bungie news articles,
   maintenance banners) exfiltrating OAuth tokens.
2. **Malicious deep-link URL** (e.g. `cruzer://…`) tricking the app into
   taking an action it shouldn't.
3. **Command injection** via the Destiny 2 in-game chat injection feature
   (`d2_inject_join`) if an attacker-controlled string reaches it.
4. **Supply-chain compromise** of an npm dependency stealing tokens at
   runtime.
5. **Local disk exfiltration** (another user on a shared machine, or a
   backup image) reading our `localStorage` or config files and recovering
   long-lived refresh tokens.

Out of scope:
- Physical access to an unlocked user machine.
- Bungie's own OAuth / API vulnerabilities.
- Attacks that require already-installed malware with admin rights.

## Hardening in place
| Layer | Control |
| ----- | ------- |
| Network / webview | Strict Tauri CSP: `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'none'`, narrow `connect-src` allowlist. |
| Network / webview | All cross-origin navigation goes through `@tauri-apps/plugin-shell` with a per-URL allowlist. |
| OAuth | PKCE flow with single-use state + verifier, cleared after code exchange. Token exchange runs Rust-side so `Origin` headers aren't sent to Bungie. |
| OAuth | Refresh tokens are stored in the Windows Credential Manager (DPAPI-backed, scoped to the logged-in user) via `secure_store_*` Tauri commands. They never touch the webview's `localStorage`. |
| OAuth | Access tokens (1h lifetime) live only in memory / `localStorage`; `localStorage` never receives refresh-token material, so even a full `localStorage` dump cannot extend a session past its short expiry. |
| OAuth | When "Remember me" is off, every token lives in memory only and is dropped on window close. |
| OAuth logs | Refresh failures log the error message only, never the error object or token material. |
| Deep link | Handler validates `protocol === "cruzer:"`, `host === "auth"`, `pathname === "/callback"` before routing. Unknown URLs are ignored. |
| In-game chat | `d2_inject_join` rejects strings > 128 chars or containing any control character before reaching `SendInput`. |
| HTML render | `sanitizeHtml()` runs DOMPurify (real HTML parser, not regex): strict tag allowlist, `on*` handlers dropped, `javascript:` / `vbscript:` / `data:text/html` URIs blocked, anchors with `target=_blank` forced to `rel="noopener noreferrer"`. |
| Rust IPC | Each `#[tauri::command]` validates its inputs. `fetch_article_body` restricts URLs to `bungie.net`. |
| Secrets | The Bungie API key in `.env` is a **public** client identifier — by Bungie's OAuth design, it is meant to be distributed with the app. No confidential material ships in the bundle. |

## Known limits
1. **CSP `style-src 'unsafe-inline'`.** Tailwind generates inline styles,
   so the webview CSP permits them. A successful HTML injection (bypassing
   our sanitizer) could restyle the UI but still cannot execute scripts
   (blocked by `script-src 'self'` with no `'unsafe-inline'` on scripts).
2. **Credential-Manager entries are readable by any code running as the
   same Windows user.** DPAPI encrypts the refresh token at rest, but the
   decryption is transparent for any process the user runs. Any already-
   installed malware executing as that user can still retrieve the token.
   Mitigating this requires OS-level process isolation outside the app's
   scope.

## Verifying a release
Every signed installer is published with its SHA-256 checksum on
[cruzer.gg](https://cruzer.gg/#download). Verify with:

```powershell
certutil -hashfile Cruzer-Compagnon_0.1.0_x64.msi SHA256
```

If the output doesn't match the value on the site, **do not run the
installer** — report it to the maintainer.