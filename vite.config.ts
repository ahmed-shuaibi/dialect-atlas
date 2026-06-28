import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { rmSync } from "node:fs";
import path from "node:path";

/**
 * The monolithic public/data/atlas.json is the committed regen target of build_atlas_data, but
 * the app now fetches the sharded atlas/ tree instead. Drop the 1.66MB monolith from the build
 * output so it isn't deployed as dead weight. (Re-shard with `node scripts/shard-atlas.mjs`.)
 */
function dropAtlasMonolith(): Plugin {
  return {
    name: "drop-atlas-monolith",
    apply: "build",
    closeBundle() {
      rmSync(path.resolve(__dirname, "dist/data/atlas.json"), { force: true });
    },
  };
}

// GitHub Pages project site: assets served under /dialect-atlas/ in production.
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/dialect-atlas/" : "/",
  plugins: [react(), tailwindcss(), dropAtlasMonolith()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    rollupOptions: {
      output: {
        // Isolate the graph engine in its own chunk. NetworkView is React.lazy'd, so this chunk
        // is only fetched when the topology panel mounts — it never blocks first paint of the
        // ranked table (the hero).
        manualChunks: {
          cytoscape: ["cytoscape", "cytoscape-fcose"],
        },
      },
    },
  },
}));
