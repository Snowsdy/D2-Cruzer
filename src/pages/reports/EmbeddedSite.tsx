import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  url: string;
  siteName: string;
  accentBorder: string;
}

export function EmbeddedSite({ url, siteName, accentBorder }: Props) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const open = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden panel border ${accentBorder}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-bungie-border">
        <div className="text-xs text-bungie-muted">
          {t("reports.embedded")}{" "}
          <span className="text-bungie-accent">{siteName}</span> ·{" "}
          <span className="opacity-60">{new URL(url).host}</span>
        </div>
        <button
          onClick={open}
          className="text-xs text-bungie-accent hover:underline"
        >
          {t("reports.openExternal")} →
        </button>
      </div>
      <div className="relative bg-black" style={{ height: "calc(100vh - 14rem)" }}>
        {!loaded && !errored && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-bungie-muted">{t("common.loading")}</p>
          </div>
        )}
        {errored && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center max-w-md space-y-3">
              <p className="text-red-400 font-semibold">
                {t("reports.embedFailed")}
              </p>
              <p className="text-sm text-bungie-muted">
                {t("reports.embedFallback")}
              </p>
              <button onClick={open} className="btn-primary">
                {t("reports.openExternal")} →
              </button>
            </div>
          </div>
        )}
        <iframe
          src={url}
          title={siteName}
          className="w-full h-full"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}