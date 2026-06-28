import { Suspense, lazy } from "react";
import type { ComponentProps } from "react";
import type { NetworkView as NetworkViewImpl } from "@/features/atlas/components/NetworkView";

// Code-split Cytoscape + cytoscape-fcose into their own chunk: the eager import of the network
// module lives only inside this dynamic import, so the (heavy) graph engine ships separately and
// never blocks first paint of the ranked table (the hero). See manualChunks in vite.config.ts.
const Impl = lazy(() =>
  import("@/features/atlas/components/NetworkView").then((m) => ({ default: m.NetworkView })),
);

/**
 * Lazy NetworkView. The fallback mirrors the real canvas geometry (same height clamp + surface)
 * so swapping in the graph causes no layout shift (CLS).
 */
export function NetworkView(props: ComponentProps<typeof NetworkViewImpl>) {
  return (
    <Suspense fallback={<NetworkFallback />}>
      <Impl {...props} />
    </Suspense>
  );
}

function NetworkFallback() {
  return (
    <div
      className="canvas-surface relative h-network w-full animate-pulse"
      role="status"
      aria-label="Loading topology graph"
    />
  );
}
