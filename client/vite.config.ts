// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
// vite.config.ts

export default defineConfig({
  // ... your existing config
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Replace with your Express server port
        changeOrigin: true,
        secure: false,
      },
    },
    entry: "server",
  },
});
