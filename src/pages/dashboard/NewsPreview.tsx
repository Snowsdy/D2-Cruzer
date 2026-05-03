import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";

interface NewsArticle {
  title: string;
  link: string;
  published: string;
  summary: string;
  imageUrl: string | null;
  source: string;
}

const API_KEY = import.meta.env.VITE_BUNGIE_API_KEY as string;

export function NewsPreview() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["news", "all"],
    queryFn: () =>
      invoke<NewsArticle[]>("fetch_news", { game: "all", apiKey: API_KEY }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const items = data?.slice(0, 3) ?? [];

  const openLink = async (url: string) => {
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
    } catch {
      window.open(url, "_blank");
    }
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      dateStyle: "medium",
    }).format(new Date(iso));

  return (
    <div className="panel p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="section-title">{t("nav.news")}</h3>
        <Link
          to="/news"
          className="text-xs text-bungie-accent hover:underline"
        >
          {t("dashboard.viewAll")}
        </Link>
      </div>
      {isLoading && (
        <p className="text-bungie-muted text-sm">{t("common.loading")}</p>
      )}
      <div className="space-y-2">
        {items.map((a) => (
          <button
            key={a.link}
            onClick={() => openLink(a.link)}
            className="w-full text-left flex gap-3 p-2 rounded-md hover:bg-white/5 transition-colors"
          >
            {a.imageUrl && (
              <img
                src={a.imageUrl}
                alt=""
                className="w-16 h-12 object-cover rounded shrink-0"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{a.title}</div>
              <div className="text-[10px] text-bungie-muted mt-0.5">
                {fmt(a.published)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}