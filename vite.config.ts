// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        devOptions: { enabled: false },
        includeAssets: ["favicon.ico", "icon.svg", "icon-maskable.svg"],
        manifest: false, // we ship /public/manifest.webmanifest ourselves
        workbox: {
          // Never precache HTML: the app is server-rendered and stale HTML would
          // point at asset hashes that no longer exist (page renders unstyled).
          globPatterns: ["**/*.{js,css,svg,png,ico,woff2}"],
          // Web Push handlers live in their own file and are pulled into the generated SW.
          importScripts: ["/push-sw.js"],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: {
                cacheName: "waffer-pages-v2",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.(?:js|css)$/.test(url.pathname),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "waffer-code-v2",
                expiration: { maxEntries: 160, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
            {
              urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.(?:woff2|svg|png|ico)$/.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "waffer-assets-v2",
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },

      }),
    ],
  },
});
