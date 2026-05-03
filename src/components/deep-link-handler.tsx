import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Tracks URLs we've already processed this session so a duplicate
// event (e.g. double onOpenUrl fire, or stale queued URL) isn't re-used.
const processed = new Set<string>();

export function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {

    let unlisten: (() => void) | undefined;

    (async () => {
      try {
        const dl = await import("@tauri-apps/plugin-deep-link");
        unlisten = await dl.onOpenUrl((urls) => {
          for (const u of urls) {
            if (!processed.has(u)) {
              processed.add(u);
              handleUrl(u);
              break; // only handle the first new URL per event batch
            }
          }
        });
      } catch {
        // Not running under Tauri (plain browser) — ignore.
      }
    })();

    function handleUrl(raw: string) {
      try {
        const url = new URL(raw);
        // Defense in depth: the OS should only dispatch our registered
        // scheme here, but double-check explicitly so a malformed URL or
        // a future scheme registration can't reroute auth traffic.
        if (url.protocol !== "cruzer:") return;
        if (url.host !== "auth" || url.pathname !== "/callback") return;
        navigate(`/auth/callback?${url.searchParams.toString()}`, {
          replace: true,
        });
      } catch {
        /* ignore malformed URLs */
      }
    }

    return () => {
      unlisten?.();
    };
  }, [navigate]);

  return null;
}