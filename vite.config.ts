import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf8")
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    // Split heavy vendor code into dedicated chunks so updates to our own
    // source don't invalidate the browser's cached copy of React / Bungie
    // types / TanStack Query etc. Gives returning users a faster cold load.
    //
    // Vite 8 (Rolldown) requires the functional form of `manualChunks`; we
    // match by substring so both npm and pnpm layouts resolve correctly.
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (!id.includes("node_modules")) return undefined;
          // Match on path segments with trailing slash so e.g. `react-dom`
          // doesn't spuriously match the `react-i18next` lookup below.
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/react-router-dom/") ||
            id.includes("/node_modules/react-router/") ||
            id.includes("/node_modules/scheduler/")
          ) {
            return "react-vendor";
          }
          if (id.includes("/node_modules/@tanstack/react-query")) {
            return "query-vendor";
          }
          if (
            id.includes("/node_modules/i18next/") ||
            id.includes("/node_modules/i18next-browser-languagedetector/") ||
            id.includes("/node_modules/react-i18next/")
          ) {
            return "i18n-vendor";
          }
          if (id.includes("/node_modules/@tauri-apps/")) {
            return "tauri-vendor";
          }
          return undefined;
        },
      },
    },
    // Raise the warning threshold now that vendor chunks are split out and
    // the remaining "large" main chunk is down to the app's own code.
    chunkSizeWarningLimit: 700,
  },
})
