// Defense-in-depth HTML sanitizer for content that will flow into
// `dangerouslySetInnerHTML`. The CSP (script-src 'self', object-src 'none',
// form-action 'none', frame-ancestors 'none') already blocks the dangerous
// sinks at the browser level — this adds a belt-and-suspenders pass at the
// string level, primarily to strip obviously malicious markup coming from
// third parties (Bungie news HTML, RSS descriptions, maintenance banners).
//
// NOT a full parser. Trades perfect fidelity for simplicity. If we ever need
// rich sanitization, swap this for DOMPurify.

const SCRIPT_RE = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
const STYLE_RE = /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;
// Block-level dangerous containers that can load foreign content / JS.
const DANGEROUS_TAGS_RE =
  /<\/?(?:iframe|object|embed|frame|frameset|base|meta|link)\b[^>]*>/gi;
// on... event attribute handlers. Uses `[\s/]+` instead of `\s+` so we also
// catch `<svg/onload=…>` — a common XSS trick where the parser treats the
// slash as attribute separator. Matches `onfoo=value`, `onfoo="v"`, `onfoo='v'`.
const EVENT_ATTR_RE = /[\s/]+on[a-z][a-z0-9_-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
// javascript: + vbscript: URIs on any navigation-bearing attribute. Also
// strips `data:` URIs with a *text* MIME (data:text/html etc — the real
// XSS vector) but leaves image-typed data URIs alone so Bungie's lazy-load
// placeholders don't erase the whole `src` attribute.
const BAD_URI_RE =
  /\b(?:href|src|xlink:href|action|formaction|srcdoc|poster)\s*=\s*(?:"\s*(?:javascript:|vbscript:|data:(?!image\/))[^"]*"|'\s*(?:javascript:|vbscript:|data:(?!image\/))[^']*')/gi;

/**
 * Strips scripts, style blocks, embed-like tags, event handlers, and
 * `javascript:` / `vbscript:` / `data:` URIs.
 *
 * NOT a full HTML parser — regex-based, so a motivated attacker with
 * attacker-controlled input could still craft bypasses (nested / malformed
 * entities, etc.). Acceptable here because this is *defense in depth* on
 * top of the app's CSP (no `'unsafe-inline'` on script, no `object-src`,
 * no form-action) and the inputs are first-party-ish (Bungie news, Bungie
 * maintenance banners). If we ever render truly adversarial HTML, swap this
 * for DOMPurify.
 */
export function sanitizeHtml(input: string | undefined | null): string {
  if (!input) return "";
  return input
    .replace(SCRIPT_RE, "")
    .replace(STYLE_RE, "")
    .replace(DANGEROUS_TAGS_RE, "")
    .replace(EVENT_ATTR_RE, "")
    .replace(BAD_URI_RE, "");
}