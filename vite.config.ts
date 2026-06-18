import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// GitHub Pages project site: assets served under /dialect-atlas/ in production.
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/dialect-atlas/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
}));
