import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Production is served from the custom-domain root. Environment overrides keep
// preview builds portable without changing source or immutable release data.
export default defineConfig(() => {
  const siteUrl = (
    process.env.ATLAS_SITE_URL ?? "https://dialectcanceratlas.com"
  ).replace(/\/$/, "");
  return {
    base: process.env.ATLAS_BASE_PATH ?? "/",
    plugins: [
      {
        name: "atlas-site-metadata",
        transformIndexHtml: (html: string) => html.replaceAll("__ATLAS_SITE_URL__", siteUrl),
      },
      react(),
      tailwindcss(),
    ],
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  };
});
