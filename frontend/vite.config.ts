import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "frontend",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true
      },
      // The standalone Help & Library page is server-rendered by the Express
      // app (src/routes/helpRouter.ts), not part of the Vite/SPA bundle -
      // proxy it too so `target="_blank"` links to it work in local dev the
      // same way they do in production (a single Express server serving
      // everything).
      "/help": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173
  },
  build: {
    outDir: "../dist-web",
    emptyOutDir: true
  }
});

