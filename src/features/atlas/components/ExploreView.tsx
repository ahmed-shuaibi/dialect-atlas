import { InteractionLane } from "@/features/atlas/components/InteractionLane";
import { resultsForMode } from "@/features/atlas/lib/atlas-transform";
import type { AtlasMode, CohortData, InteractionResult } from "@/features/atlas/types";

export function ExploreView({
  data,
  mode,
  strict,
  onSelect,
}: {
  data: CohortData;
  mode: AtlasMode;
  strict: boolean;
  onSelect: (result: InteractionResult) => void;
}) {
  const me = resultsForMode(data, mode, "ME", strict);
  const co = resultsForMode(data, mode, "CO", strict);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <p className="max-w-xl text-balance text-lg font-semibold leading-7">
          Less often together on the left. More often together on the right.
        </p>
        <p className="text-xs font-semibold text-muted">
          <span className="font-mono">_M</span> missense · <span className="font-mono">_N</span>{" "}
          nonsense · Select a pair for full evidence.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-7">
        <InteractionLane direction="ME" results={me} mode={mode} onSelect={onSelect} />
        <InteractionLane direction="CO" results={co} mode={mode} onSelect={onSelect} />
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div aria-label="Loading cohort interactions" role="status" className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-7">
      {[0, 1].map((lane) => (
        <div key={lane} className="space-y-4">
          <div className="h-12 w-2/3 animate-pulse rounded-full bg-ink/[0.07]" />
          <div className="h-72 animate-pulse rounded-[2rem] bg-paper" />
          <div className="h-72 animate-pulse rounded-[2rem] bg-paper" />
        </div>
      ))}
    </div>
  );
}
