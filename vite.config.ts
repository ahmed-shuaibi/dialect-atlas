import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// GitHub Pages uses the project subpath. A custom-domain build can set
// ATLAS_BASE_PATH=/ and ATLAS_SITE_URL without changing source or release data.
export default defineConfig(({ mode }) => {
  const siteUrl = (
    process.env.ATLAS_SITE_URL ?? "https://ahmed-shuaibi.github.io/dialect-atlas"
  ).replace(/\/$/, "");
  return {
    base: process.env.ATLAS_BASE_PATH ?? (mode === "production" ? "/dialect-atlas/" : "/"),
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
