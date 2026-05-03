import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCurrentWindow } from "@tauri-apps/api/window";
import cruzerLogo from "@/assets/cruzer-logo.png";

export function TitleBar() {
  const { t } = useTranslation();
  const [isMax, setIsMax] = useState(false);

  useEffect(() => {
    const w = getCurrentWindow();
    let unlistenResize: (() => void) | undefined;
    (async () => {
      try {
        setIsMax(await w.isMaximized());
        unlistenResize = await w.onResized(async () => {
          setIsMax(await w.isMaximized());
        });
      } catch {
        // No-op outside Tauri
      }
    })();
    return () => {
      unlistenResize?.();
    };
  }, []);

  const minimize = () => {
    void getCurrentWindow().minimize();
  };
  const toggleMax = () => {
    void getCurrentWindow().toggleMaximize();
  };
  const close = () => {
    void getCurrentWindow().close();
  };

  return (
    <div
      data-tauri-drag-region
      className="relative h-9 flex items-center select-none bg-bungie-bg border-b border-bungie-border/60 pl-3 pr-0 text-[11px]"
    >
      {/* Brand left */}
      <div className="flex items-center gap-2 pointer-events-none" data-tauri-drag-region>
        <img
          src={cruzerLogo}
          alt=""
          className="w-4 h-4 drop-shadow-[0_0_4px_rgba(243,7,94,0.6)] logo-pulse"
        />
        <span className="font-extrabold tracking-[0.18em] text-[11px] text-gradient uppercase">
          Cruzer Compagnon
        </span>
      </div>

      {/* Drag region fills remaining space */}
      <div className="flex-1 h-full" data-tauri-drag-region />

      {/* Window controls */}
      <div className="flex items-stretch h-full">
        <button
          onClick={minimize}
          title={t("common.minimize")}
          aria-label={t("common.minimize")}
          className="w-11 h-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/8 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="1" y1="5" x2="9" y2="5" />
          </svg>
        </button>
        <button
          onClick={toggleMax}
          title={isMax ? t("common.restore") : t("common.maximize")}
          aria-label={isMax ? t("common.restore") : t("common.maximize")}
          className="w-11 h-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/8 transition-colors"
        >
          {isMax ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2.5" y="0.5" width="7" height="7" />
              <rect x="0.5" y="2.5" width="7" height="7" fill="var(--bg, #07070d)" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="9" height="9" />
            </svg>
          )}
        </button>
        <button
          onClick={close}
          title={t("common.close")}
          aria-label={t("common.close")}
          className="w-11 h-full flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </div>
  );
}