import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { invoke } from "@tauri-apps/api/core"
import { Link } from "react-router-dom"

interface NewsArticle {
  title: string
  link: string
  published: string
  summary: string
  imageUrl: string | null
  source: string
}

const API_KEY = import.meta.env.VITE_BUNGIE_API_KEY as string

export function NewsPreview() {
  const { t, i18n } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ["news", "all"],
    queryFn: () =>
      invoke<NewsArticle[]>("fetch_news", { game: "all", apiKey: API_KEY }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const items = data?.slice(0, 3) ?? []

  const openLink = async (url: string) => {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener")
      await openUrl(url)
    } catch {
      window.open(url, "_blank")
    }
  }

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      dateStyle: "medium",
    }).format(new Date(iso))

  return (
    <div className="panel space-y-3 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="section-title">{t("nav.news")}</h3>
        <Link to="/news" className="text-bungie-accent text-xs hover:underline">
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
            className="flex w-full gap-3 rounded-md p-2 text-left transition-colors hover:bg-white/5"
          >
            {a.imageUrl && (
              <img
                src={a.imageUrl}
                alt=""
                className="h-12 w-16 shrink-0 rounded object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{a.title}</div>
              <div className="text-bungie-muted mt-0.5 text-[10px]">
                {fmt(a.published)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
