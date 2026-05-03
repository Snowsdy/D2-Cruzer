import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { ExternalLinkGuard } from "@/components/external-link-guard.tsx"
import { DebugPanel } from "@/components/debug-panel.tsx"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 10s — minute-precise UX while still
      // reusing the cache for rapid re-renders within a short window.
      staleTime: 10_000,
      // Keep unused queries around for 10 min so tab-switching is instant.
      gcTime: 10 * 60_000,
      // Retry twice with exponential backoff — covers transient Bungie 5xx
      // and rate-limit spikes without compounding on hard failures.
      retry: (failureCount, error) => {
        // Don't retry permanent client errors (4xx except 429).
        const status = (error as { status?: number })?.status ?? 0;
        if (status >= 400 && status < 500 && status !== 429) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) =>
        Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Don't waste API calls when the window is hidden.
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <ExternalLinkGuard />
          {import.meta.env.DEV ? <DebugPanel /> : null}
          <main data-ui-scroll-container><App /></main>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
