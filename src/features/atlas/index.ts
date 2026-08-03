// Public surface of the atlas feature — exactly what App.tsx consumes. Everything else is
// internal and imported by sibling modules via path. Keep this minimal: a wider barrel only
// invites cross-feature coupling.

// Types
export type { Bmr, DirFilter } from "@/features/atlas/types";

// Hooks
export { useAtlas, useCohort } from "@/features/atlas/hooks/useAtlas";
export { VIEW_DEFAULTS, resolveCohort, useAtlasView } from "@/features/atlas/hooks/useAtlasView";

// Components
export { CrossModelStrip } from "@/features/atlas/components/CrossModelStrip";
export { EditorialHeader } from "@/features/atlas/components/EditorialHeader";
// Lazy NetworkView: Cytoscape ships in its own chunk (see NetworkView.lazy + manualChunks).
// The NetSelection type comes from the eager module (types are erased — no runtime import).
export { NetworkView } from "@/features/atlas/components/NetworkView.lazy";
export type { NetSelection } from "@/features/atlas/components/NetworkView";
export { ResultTable } from "@/features/atlas/components/ResultTable";
