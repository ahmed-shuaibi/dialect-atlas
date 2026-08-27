import { Check, List, ListFilter, Share2 } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl, SegmentedControlButton } from "@/components/ui/segmented-control";
import { InteractionList } from "@/features/atlas/components/InteractionList";
import { resultsForNetwork } from "@/features/atlas/components/explore-display";
import { exploreResults, filterResultsByGene } from "@/features/atlas/lib/atlas-transform";
import type {
  AtlasMode,
  CohortData,
  ExploreDisplay,
  InteractionResult,
} from "@/features/atlas/types";

const InteractionNetwork = lazy(async () => {
  const module = await import("@/features/atlas/components/InteractionNetwork");
  return { default: module.InteractionNetwork };
});

function EmptyExplore({
  query,
  qThreshold,
  significantOnly,
  onClearQuery,
  onShowRanked,
}: {
  query: string;
  qThreshold: number;
  significantOnly: boolean;
  onClearQuery: () => void;
  onShowRanked: () => void;
}) {
  const searched = query.trim().length > 0;
  return (
    <div className="surface-card py-20 text-center">
      <p className="text-xl font-semibold">
        {searched ? "No pairs match that gene." : `No pairs meet q < ${qThreshold}.`}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {searched && (
          <Button type="button" onClick={onClearQuery} size="sm">
            Clear search
          </Button>
        )}
        {!searched && significantOnly && (
          <Button type="button" variant="outline" size="sm" onClick={onShowRanked}>
            Show ranked pairs
          </Button>
        )}
      </div>
    </div>
  );
}

export function ExploreView({
  data,
  mode,
  display,
  qThreshold,
  significantOnly,
  onDisplayChange,
  onSignificantOnlyChange,
  onSelect,
}: {
  data: CohortData;
  mode: AtlasMode;
  display: ExploreDisplay;
  qThreshold: number;
  significantOnly: boolean;
  onDisplayChange: (display: ExploreDisplay) => void;
  onSignificantOnlyChange: (significantOnly: boolean) => void;
  onSelect: (result: InteractionResult) => void;
}) {
  const [query, setQuery] = useState("");
  useEffect(() => setQuery(""), [data.id]);
  const results = useMemo(
    () => exploreResults(data, mode, { qThreshold, significantOnly }),
    [data, mode, qThreshold, significantOnly],
  );
  const visibleResults = useMemo(
    () => filterResultsByGene(results, query),
    [query, results],
  );
  const networkResults = useMemo(
    () => resultsForNetwork(visibleResults),
    [visibleResults],
  );

  return (
    <section aria-label="Interaction results">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Find a gene"
          label="Find a gene"
          className="w-full sm:w-64"
        />
        <Button
          type="button"
          variant="filter"
          size="sm"
          aria-pressed={significantOnly}
          onClick={() => onSignificantOnlyChange(!significantOnly)}
        >
          {significantOnly ? <Check className="size-4" aria-hidden /> : <ListFilter className="size-4" aria-hidden />}
          Significant only
        </Button>
        <SegmentedControl aria-label="Explore display" className="sm:ml-auto">
          <SegmentedControlButton active={display === "list"} onClick={() => onDisplayChange("list")}>
            <List className="size-4" aria-hidden />
            List
          </SegmentedControlButton>
          <SegmentedControlButton active={display === "network"} onClick={() => onDisplayChange("network")}>
            <Share2 className="size-4" aria-hidden />
            Network
          </SegmentedControlButton>
        </SegmentedControl>
      </div>

      {visibleResults.length === 0 ? (
        <EmptyExplore
          query={query}
          qThreshold={qThreshold}
          significantOnly={significantOnly}
          onClearQuery={() => setQuery("")}
          onShowRanked={() => onSignificantOnlyChange(false)}
        />
      ) : display === "network" ? (
        <Suspense
          fallback={
            <div
              role="status"
              className="surface-card grid h-[min(68vh,720px)] min-h-[31rem] place-items-center text-base font-semibold text-muted"
            >
              Drawing interaction network…
            </div>
          }
        >
          <InteractionNetwork
            results={networkResults}
            totalResults={visibleResults.length}
            mode={mode}
            qThreshold={qThreshold}
            query={query}
            onSelect={onSelect}
          />
        </Suspense>
      ) : (
        <InteractionList results={visibleResults} mode={mode} qThreshold={qThreshold} onSelect={onSelect} />
      )}
    </section>
  );
}

export function ResultsSkeleton() {
  return (
    <div aria-label="Loading cohort interactions" role="status" className="space-y-5">
      <div className="h-11 w-full max-w-xl animate-pulse rounded-full bg-ink/[0.07]" />
      <div className="h-[min(68vh,720px)] min-h-[31rem] animate-pulse rounded-[24px] bg-paper" />
    </div>
  );
}
