import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { useQueries, useQuery } from "@tanstack/react-query"
import { trackedInvoke } from "@/lib/tauri"
import { sanitizeHtml } from "@/utils/sanitizeHtml"

interface NewsArticle {
  title: string
  link: string
  published: string
  summary: string
  contentHtml: string
  imageUrl: string | null
  source: "destiny" | "marathon" | "bungie"
}

interface Tweet {
  author: string
  authorHandle: string
  authorAvatar: string | null
  content: string
  published: string
  link: string
}

const API_KEY = import.meta.env.VITE_BUNGIE_API_KEY as string

async function fetchNews(
  game: "destiny" | "marathon" | "all"
): Promise<NewsArticle[]> {
  return trackedInvoke<NewsArticle[]>("fetch_news", { game, apiKey: API_KEY })
}

async function fetchTweets(): Promise<Tweet[]> {
  return trackedInvoke<Tweet[]>("fetch_tweets")
}

const SOURCE_META: Record<
  NewsArticle["source"],
  { label: string; accent: string; border: string }
> = {
  destiny: {
    label: "Destiny 2",
    accent: "text-white",
    border: "border-white/40",
  },
  marathon: {
    label: "Marathon",
    // Marathon's brand neon lime — matches the official game palette.
    accent: "text-[#c7ff00]",
    border: "border-[#c7ff00]/50",
  },
  bungie: {
    label: "Bungie",
    accent: "text-pink-300",
    border: "border-pink-500/40",
  },
}

// The front-page hero card always uses the Bungie accent yellow so the
// featured story stands out regardless of its source.
const FEATURED_ACCENT = {
  accent: "text-yellow-300",
  border: "border-yellow-400/60",
  shadow: "shadow-[0_0_32px_rgba(250,204,21,0.2)]",
}

export function News() {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState<"all" | "destiny" | "marathon" | "tweets">(
    "all"
  )
  const [openArticle, setOpenArticle] = useState<NewsArticle | null>(null)

  const news = useQuery({
    queryKey: ["news", tab === "tweets" ? "all" : tab],
    queryFn: () => fetchNews(tab === "tweets" ? "all" : tab),
    enabled: tab !== "tweets",
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const tweets = useQuery({
    queryKey: ["tweets"],
    queryFn: fetchTweets,
    enabled: tab === "tweets",
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const items = news.data ?? []
  const [featured, ...rest] = items

  // Prefetch every article body in parallel so the reader opens with zero
  // latency — queries share `["articleBody", link]` keys with the reader's
  // on-click fetch, so cache hits are instant.
  useQueries({
    queries: items.map((a) => ({
      queryKey: ["articleBody", a.link],
      queryFn: () =>
        trackedInvoke<string>("fetch_article_body", { url: a.link }),
      staleTime: 10 * 60_000,
      gcTime: 30 * 60_000,
    })),
  })

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      dateStyle: "long",
    }).format(new Date(iso))

  const fmtRelative = (iso: string) => {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const m = Math.floor(diff / 60_000)
    if (m < 1) return "à l'instant"
    if (m < 60) return `il y a ${m} min`
    const h = Math.floor(m / 60)
    if (h < 24) return `il y a ${h}h`
    const days = Math.floor(h / 24)
    if (days < 7) return `il y a ${days}j`
    return new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      dateStyle: "medium",
    }).format(d)
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("nav.news")}</h1>
          <p className="text-bungie-muted mt-1 text-sm">{t("news.subtitle")}</p>
        </div>
        <button
          onClick={() => (tab === "tweets" ? tweets.refetch() : news.refetch())}
          disabled={news.isFetching || tweets.isFetching}
          className="border-bungie-border hover:border-bungie-accent/50 text-bungie-muted rounded-full border px-3 py-1.5 text-xs transition-all hover:text-white disabled:opacity-50"
        >
          {news.isFetching || tweets.isFetching
            ? t("common.loading")
            : t("common.refresh")}
        </button>
      </div>

      <div className="border-bungie-border flex w-fit gap-1 rounded-full border bg-black/30 p-1">
        {(["all", "destiny", "marathon", "tweets"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setTab(g)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              tab === g
                ? "bg-bungie-accent text-black"
                : "text-bungie-text/70 hover:text-white"
            }`}
          >
            {g === "tweets" ? t("news.tab.tweets") : t(`news.tab.${g}`)}
          </button>
        ))}
      </div>

      {tab === "tweets" ? (
        <TweetsList
          tweets={tweets.data ?? []}
          isLoading={tweets.isLoading}
          error={tweets.error}
          fmtRelative={fmtRelative}
          t={t}
        />
      ) : (
        <>
          {news.isLoading && (
            <p className="text-bungie-muted">{t("common.loading")}</p>
          )}
          {news.error && (
            <div className="panel border border-red-500/40 p-4 text-sm text-red-400">
              {(news.error as Error).message}
            </div>
          )}

          {featured && (
            <button
              onClick={() => setOpenArticle(featured)}
              className={`relative block w-full overflow-hidden rounded-2xl border-2 ${FEATURED_ACCENT.border} hover:-translate-y-0.5 hover:${FEATURED_ACCENT.shadow} group text-left transition-all`}
              style={
                featured.imageUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(7,7,13,0.2) 0%, rgba(7,7,13,0.7) 60%, rgba(7,7,13,0.95) 100%), url(${featured.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <div className="absolute top-3 left-3 z-10">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${FEATURED_ACCENT.border} ${FEATURED_ACCENT.accent} bg-black/60`}
                >
                  ★ À la une
                </span>
              </div>
              <div className="flex aspect-21/8 w-full flex-col justify-end p-6">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${SOURCE_META[featured.source].border} ${SOURCE_META[featured.source].accent} bg-black/40`}
                  >
                    {SOURCE_META[featured.source].label}
                  </span>
                  <span className="text-[10px] tracking-widest text-white/60 uppercase">
                    {fmt(featured.published)}
                  </span>
                </div>
                <h2
                  className={`max-w-3xl text-3xl leading-tight font-bold text-white drop-shadow group-hover:${FEATURED_ACCENT.accent} transition-colors`}
                >
                  {featured.title}
                </h2>
                {featured.summary && (
                  <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-white/80 drop-shadow">
                    {featured.summary}
                  </p>
                )}
                <div
                  className={`mt-3 text-xs font-semibold tracking-widest uppercase ${FEATURED_ACCENT.accent}`}
                >
                  {t("news.readMore")} →
                </div>
              </div>
            </button>
          )}

          {rest.length > 0 && (
            <div className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rest.map((a) => {
                const meta = SOURCE_META[a.source]
                return (
                  <button
                    key={a.link}
                    onClick={() => setOpenArticle(a)}
                    className={`bg-bungie-panel relative overflow-hidden rounded-xl border-2 ${meta.border} group text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(245,166,35,0.1)]`}
                  >
                    {a.imageUrl ? (
                      <div
                        className="aspect-video w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${a.imageUrl})` }}
                      />
                    ) : (
                      <div className="from-bungie-panel flex aspect-video w-full items-center justify-center bg-linear-to-br to-black/60">
                        <span className={`text-2xl ${meta.accent} opacity-40`}>
                          ✦
                        </span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase ${meta.border} ${meta.accent}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-bungie-muted text-[10px]">
                          {fmt(a.published)}
                        </span>
                      </div>
                      <h3 className="group-hover:text-bungie-accent line-clamp-2 leading-snug font-bold text-white transition-colors">
                        {a.title}
                      </h3>
                      {a.summary && (
                        <p className="text-bungie-muted mt-2 line-clamp-2 text-xs">
                          {a.summary}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {items.length === 0 && !news.isLoading && (
            <p className="text-bungie-muted text-sm">{t("news.empty")}</p>
          )}
        </>
      )}

      {openArticle && (
        <ArticleReader
          article={openArticle}
          fmt={fmt}
          onClose={() => setOpenArticle(null)}
        />
      )}
    </div>
  )
}

function TweetsList({
  tweets,
  isLoading,
  error,
  fmtRelative,
  t,
}: {
  tweets: Tweet[]
  isLoading: boolean
  error: unknown
  fmtRelative: (iso: string) => string
  t: (key: string) => string
}) {
  if (isLoading)
    return <p className="text-bungie-muted">{t("common.loading")}</p>
  if (error)
    return (
      <div className="panel border border-red-500/40 p-4 text-sm text-red-400">
        {(error as Error).message}
      </div>
    )
  if (tweets.length === 0)
    return <p className="text-bungie-muted text-sm">{t("news.noTweets")}</p>

  return (
    <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {tweets.map((tw) => (
        <div
          key={tw.link}
          className="panel border border-pink-500/20 p-4 transition-all hover:border-pink-500/40"
        >
          <div className="mb-2 flex items-center gap-2">
            {tw.authorAvatar ? (
              <img
                src={tw.authorAvatar}
                alt=""
                className="h-8 w-8 rounded-full border border-white/20"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/40 text-xs font-bold text-pink-300">
                {tw.author.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate font-semibold text-white">
                {tw.author}
              </div>
              <div className="text-bungie-muted truncate text-[10px]">
                @{tw.authorHandle} · {fmtRelative(tw.published)}
              </div>
            </div>
          </div>
          <p className="line-clamp-8 text-sm whitespace-pre-line text-white/85">
            {tw.content}
          </p>
        </div>
      ))}
    </div>
  )
}

function ArticleReader({
  article,
  fmt,
  onClose,
}: {
  article: NewsArticle
  fmt: (iso: string) => string
  onClose: () => void
}) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (lightbox) setLightbox(null)
      else onClose()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, lightbox])

  // Delegate click on <img> inside the article body — using React's
  // synthetic events via onClick below. Kept here as a fallback ref in
  // case any inner element stops propagation.

  // Lazy-fetch the full article body (Bungie only renders it server-side
  // when the request uses a Googlebot UA — we do that in Rust).
  const body = useQuery({
    queryKey: ["articleBody", article.link],
    queryFn: () =>
      trackedInvoke<string>("fetch_article_body", { url: article.link }),
    staleTime: 10 * 60_000,
  })

  const meta = SOURCE_META[article.source]
  const fullHtml = body.data && body.data.length > 50 ? body.data : null

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/90 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <article
        onClick={(e) => e.stopPropagation()}
        className="bg-bungie-panel border-bungie-accent/40 relative my-3 w-full max-w-[min(1600px,96vw)] overflow-hidden rounded-2xl border-2 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-lg text-white/80 hover:border-white/40 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        {article.imageUrl && (
          <div
            className="aspect-21/9 max-h-90 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${article.imageUrl})` }}
          />
        )}

        <div className="px-6 py-8 sm:px-10">
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${meta.border} ${meta.accent}`}
              >
                {meta.label}
              </span>
              <span className="text-bungie-muted text-[11px]">
                {fmt(article.published)}
              </span>
            </div>

            <h1 className="text-3xl leading-tight font-bold text-white sm:text-4xl">
              {article.title}
            </h1>

            {article.summary && (
              <p className="border-bungie-accent/60 border-l-2 pl-4 text-lg text-white/75 italic">
                {article.summary}
              </p>
            )}

            {body.isLoading && (
              <p className="text-bungie-muted animate-pulse text-sm">
                Chargement du corps de l'article…
              </p>
            )}

            {fullHtml ? (
              <div
                ref={contentRef}
                onClick={(e) => {
                  const t = e.target as HTMLElement
                  if (t.tagName === "IMG") {
                    e.preventDefault()
                    setLightbox((t as HTMLImageElement).src)
                  }
                }}
                className="news-article-content text-white/85"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(fullHtml) }}
              />
            ) : !body.isLoading && article.contentHtml ? (
              <div
                ref={contentRef}
                onClick={(e) => {
                  const t = e.target as HTMLElement
                  if (t.tagName === "IMG") {
                    e.preventDefault()
                    setLightbox((t as HTMLImageElement).src)
                  }
                }}
                className="news-article-content text-white/85"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(article.contentHtml),
                }}
              />
            ) : null}
          </div>
        </div>
      </article>

      {lightbox &&
        createPortal(
          <div
            className="fixed inset-0 z-100 flex cursor-zoom-out items-center justify-center bg-black/95 p-6"
            onClick={() => setLightbox(null)}
          >
            <img
              src={lightbox}
              alt=""
              className="max-h-[95vh] max-w-[95vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                setLightbox(null)
              }}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/70 text-xl text-white hover:border-white/60"
              aria-label="Close"
            >
              ✕
            </button>
          </div>,
          document.body
        )}
    </div>
  )
}
