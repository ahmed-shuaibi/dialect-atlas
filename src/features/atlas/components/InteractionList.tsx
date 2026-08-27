import { useMemo } from "react";
import { InteractionLane } from "@/features/atlas/components/InteractionLane";
import type { AtlasMode, InteractionResult } from "@/features/atlas/types";
import { cn } from "@/lib/utils";

export function InteractionList({
  results,
  mode,
  onSelect,
}: {
  results: InteractionResult[];
  mode: AtlasMode;
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
  const showMe = me.length > 0 || co.length === 0;
  const showCo = co.length > 0 || me.length === 0;
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-10",
        showMe && showCo && "lg:grid-cols-2 lg:gap-8",
      )}
    >
      {showMe && <InteractionLane direction="ME" results={me} mode={mode} onSelect={onSelect} />}
      {showCo && <InteractionLane direction="CO" results={co} mode={mode} onSelect={onSelect} />}
    </div>
  );
}
