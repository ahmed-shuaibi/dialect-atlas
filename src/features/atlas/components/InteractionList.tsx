import { useMemo } from "react";
import { InteractionLane } from "@/features/atlas/components/InteractionLane";
import type { AtlasMode, InteractionResult } from "@/features/atlas/types";

export function InteractionList({
  results,
  mode,
  qThreshold,
  onSelect,
}: {
  results: InteractionResult[];
  mode: AtlasMode;
  qThreshold: number;
  onSelect: (result: InteractionResult) => void;
}) {
  const me = useMemo(
    () => results.filter(({ direction }) => direction === "ME"),
    [results],
  );
  const co = useMemo(
    () => results.filter(({ direction }) => direction === "CO"),
    [results],
  );
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <InteractionLane direction="ME" results={me} mode={mode} qThreshold={qThreshold} onSelect={onSelect} />
      <InteractionLane direction="CO" results={co} mode={mode} qThreshold={qThreshold} onSelect={onSelect} />
    </div>
  );
}
