import { List, Search, Share2, SlidersHorizontal, X } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { InteractionList } from "@/features/atlas/components/InteractionList";
import { resultsForNetwork } from "@/features/atlas/components/explore-display";
import {
  BMR_LABEL,
  exploreResults,
  filterResultsByGene,
} from "@/features/atlas/lib/atlas-transform";
import type {
  AtlasMode,
  CohortData,
  ExploreDirection,
  ExploreDisplay,
  InteractionResult,
} from "@/features/atlas/types";
import { cn } from "@/lib/utils";

const InteractionNetwork = lazy(async () => {
  const module = await import("@/features/atlas/components/InteractionNetwork");
  return { default: module.InteractionNetwork };
});

const DIRECTION_OPTIONS: { value: ExploreDirection; label: string; longLabel: string }[] = [
  { value: "all", label: "Both", longLabel: "Both interaction directions" },
  { value: "ME", label: "ME", longLabel: "Mutually exclusive only" },
  { value: "CO", label: "CO", longLabel: "Co-occurring only" },
];

function significanceDefinition(mode: AtlasMode): string {
  return mode === "consensus"
    ? "q < 0.01 under CBaSE, DIG, and MutSigCV2"
    : `q < 0.01 under ${BMR_LABEL[mode]}`;
}

function EmptyExplore({
  query,
  direction,
  onClearQuery,
  onShowBoth,
  onOpenSettings,
}: {
  query: string;
  direction: ExploreDirection;
  onClearQuery: () => void;
  onShowBoth: () => void;
  onOpenSettings?: () => void;
}) {
  const searched = query.trim().length > 0;
  return (
    <div className="border-y border-line py-20 text-center">
      <p className="text-lg font-bold">
        {searched ? "No significant pairs match that gene." : "No significant pairs in this view."}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        Significance is fixed at q &lt; 0.01. Change the search, direction, or background model.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {searched && (
          <button
            type="button"
            onClick={onClearQuery}
            className="focus-ring border border-ink bg-ink px-4 py-2 text-xs font-bold text-paper hover:bg-ink/85"
          >
            Clear search
          </button>
        )}
        {direction !== "all" && (
          <button
            type="button"
            onClick={onShowBoth}
            className="focus-ring border border-line bg-paper px-4 py-2 text-xs font-bold hover:border-ink/40"
          >
            Show both directions
          </button>
        )}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="focus-ring inline-flex items-center gap-2 border border-line bg-paper px-4 py-2 text-xs font-bold hover:border-ink/40"
          >
            <SlidersHorizontal className="size-3.5" aria-hidden />
            Choose another model
          </button>
        )}
      </div>
    </div>
  );
}

export function ExploreView({
  data,
  mode,
  display,
  direction,
  onDisplayChange,
  onDirectionChange,
  onOpenSettings,
  onSelect,
}: {
  data: CohortData;
  mode: AtlasMode;
  display: ExploreDisplay;
  direction: ExploreDirection;
  onDisplayChange: (display: ExploreDisplay) => void;
  onDirectionChange: (direction: ExploreDirection) => void;
  onOpenSettings?: () => void;
  onSelect: (result: InteractionResult) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => exploreResults(data, mode, direction), [data, direction, mode]);
  const visibleResults = useMemo(
    () => filterResultsByGene(results, query),
    [query, results],
  );
  const networkResults = useMemo(
    () => resultsForNetwork(visibleResults),
    [visibleResults],
  );

  return (
    <section aria-labelledby="explore-heading">
      <div className="mb-6 flex flex-col gap-5 border-b border-line pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 id="explore-heading" className="text-xl font-bold tracking-[-0.025em]">
            Significant interactions
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">{significanceDefinition(mode)}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="relative block min-w-0 sm:w-60">
            <span className="sr-only">Find a gene</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a gene"
              className="focus-ring h-10 w-full border border-line bg-paper pl-9 pr-9 text-sm outline-none placeholder:text-muted/75"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="focus-ring absolute right-1 top-1 flex size-8 items-center justify-center text-muted hover:text-ink"
                aria-label="Clear gene search"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </label>

          <div className="flex h-10 border border-line bg-paper" aria-label="Interaction direction">
            {DIRECTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-label={option.longLabel}
                aria-pressed={direction === option.value}
                onClick={() => onDirectionChange(option.value)}
                className={cn(
                  "focus-ring border-r border-line px-3 text-xs font-bold last:border-r-0 hover:bg-sand",
                  direction === option.value && "bg-ink text-paper hover:bg-ink/85",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex h-10 border border-line bg-paper" aria-label="Explore display">
            <button
              type="button"
              aria-label="Show network"
              aria-pressed={display === "network"}
              onClick={() => onDisplayChange("network")}
              className={cn(
                "focus-ring flex items-center gap-2 border-r border-line px-3 text-xs font-bold hover:bg-sand",
                display === "network" && "bg-ink text-paper hover:bg-ink/85",
              )}
            >
              <Share2 className="size-3.5" aria-hidden />
              Network
            </button>
            <button
              type="button"
              aria-label="Show list"
              aria-pressed={display === "list"}
              onClick={() => onDisplayChange("list")}
              className={cn(
                "focus-ring flex items-center gap-2 px-3 text-xs font-bold hover:bg-sand",
                display === "list" && "bg-ink text-paper hover:bg-ink/85",
              )}
            >
              <List className="size-3.5" aria-hidden />
              List
            </button>
          </div>
        </div>
      </div>

      {visibleResults.length === 0 ? (
        <EmptyExplore
          query={query}
          direction={direction}
          onClearQuery={() => setQuery("")}
          onShowBoth={() => onDirectionChange("all")}
          onOpenSettings={onOpenSettings}
        />
      ) : display === "network" ? (
        <Suspense
          fallback={
            <div
              role="status"
              className="grid h-[min(68vh,720px)] min-h-[31rem] place-items-center border border-line bg-paper text-sm font-semibold text-muted"
            >
              Drawing interaction network…
            </div>
          }
        >
          <InteractionNetwork
            results={networkResults}
            totalResults={visibleResults.length}
            mode={mode}
            query={query}
            onSelect={onSelect}
          />
        </Suspense>
      ) : (
        <InteractionList results={visibleResults} mode={mode} onSelect={onSelect} />
      )}
    </section>
  );
}

export function ResultsSkeleton() {
  return (
    <div aria-label="Loading cohort interactions" role="status" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div className="h-8 w-52 animate-pulse bg-ink/[0.07]" />
        <div className="h-10 w-full max-w-xl animate-pulse bg-ink/[0.07]" />
      </div>
      <div className="h-[min(68vh,720px)] min-h-[31rem] animate-pulse border border-line bg-paper" />
    </div>
  );
}
