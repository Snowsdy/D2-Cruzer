import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface UpdateInfo {
  version: string;
  date?: string;
  body?: string;
  download: () => Promise<void>;
  install: () => Promise<void>;
}

/**
 * Checks for Tauri app updates on mount and whenever the user hits "refresh".
 * Displays a banner when one is available and drives the download → install → relaunch flow.
 *
 * The endpoint + signing key are configured in `src-tauri/tauri.conf.json > plugins.updater`.
 */
export function UpdateBanner() {
  const { t } = useTranslation();
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [state, setState] = useState<"idle" | "downloading" | "ready" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const found = await check();
        if (cancelled || !found) return;

        let total = 0;
        let got = 0;
        setUpdate({
          version: found.version,
          date: found.date,
          body: found.body,
          download: async () => {
            setState("downloading");
            await found.download((ev) => {
              if (ev.event === "Started") {
                total = ev.data.contentLength ?? 0;
                got = 0;
              } else if (ev.event === "Progress") {
                got += ev.data.chunkLength;
                setProgress(total > 0 ? got / total : 0);
              } else if (ev.event === "Finished") {
                setProgress(1);
              }
            });
            setState("ready");
          },
          install: async () => {
            await found.install();
            const { relaunch } = await import("@tauri-apps/plugin-process");
            await relaunch();
          },
        });
      } catch (e) {
        // Silent for expected "no release yet" errors — don't scare the user.
        // These happen when GitHub Releases is empty, network is offline, or
        // the signature doesn't match. None are actionable from the UI.
        const msg = String(e).toLowerCase();
        const expected =
          msg.includes("could not fetch") ||
          msg.includes("valid release json") ||
          msg.includes("network") ||
          msg.includes("status code: 404") ||
          msg.includes("timeout") ||
          msg.includes("dns") ||
          msg.includes("connect") ||
          // reqwest surfaces transport failures as "error sending request"
          // — don't surface those to the user either.
          msg.includes("error sending request") ||
          msg.includes("resolve") ||
          msg.includes("failed to lookup") ||
          msg.includes("unreachable");
        if (import.meta.env.DEV || expected) {
          console.warn("[updater]", e);
        } else {
          setError(String(e));
          setState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!update && state !== "error") return null;

  if (state === "error") {
    return (
      <div className="px-5 py-2 text-xs text-red-300 bg-red-500/10 border-b border-red-500/30 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        <span>{t("update.error")}: {error}</span>
      </div>
    );
  }

  if (!update) return null;

  return (
    <div className="px-5 py-2 text-xs flex items-center gap-3 bg-linear-to-r from-bungie-accent/15 via-bungie-accent/5 to-transparent border-b border-bungie-accent/30">
      <span className="inline-flex items-center gap-2 text-bungie-accent font-semibold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-bungie-accent animate-pulse" />
        {t("update.available")}
      </span>
      <span className="text-white font-bold">v{update.version}</span>
      {update.date && (
        <span className="text-bungie-muted">· {update.date.split(" ")[0]}</span>
      )}

      <div className="flex-1" />

      {state === "idle" && (
        <button
          onClick={() => void update.download()}
          className="h-7 px-3 rounded-full bg-bungie-accent text-black font-bold text-[11px] hover:brightness-110 transition"
        >
          {t("update.download")}
        </button>
      )}
      {state === "downloading" && (
        <div className="flex items-center gap-2">
          <div className="w-32 h-1.5 rounded-full bg-black/40 overflow-hidden">
            <div
              className="h-full bg-bungie-accent transition-[width] duration-200"
              style={{ width: `${(progress * 100).toFixed(0)}%` }}
            />
          </div>
          <span className="text-bungie-muted tabular-nums">
            {(progress * 100).toFixed(0)}%
          </span>
        </div>
      )}
      {state === "ready" && (
        <button
          onClick={() => void update.install()}
          className="h-7 px-3 rounded-full bg-emerald-400 text-black font-bold text-[11px] hover:brightness-110 transition"
        >
          {t("update.installRestart")}
        </button>
      )}
    </div>
  );
}