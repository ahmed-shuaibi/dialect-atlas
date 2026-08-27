import { Check, List, ListFilter, Share2 } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { InteractionList } from "@/features/atlas/components/InteractionList";
import { ResultsToolbar } from "@/features/atlas/components/ResultsToolbar";
import { resultsForNetwork } from "@/features/atlas/components/explore-display";
import { exploreResults, filterResultsByGene } from "@/features/atlas/lib/atlas-transform";
import type {
  AtlasMode,
  BmrCount,
  CohortData,
  ExploreDisplay,
  InteractionResult,
} from "@/features/atlas/types";

const InteractionNetwork = lazy(async () => {
  const module = await import("@/features/atlas/components/InteractionNetwork");
  return { default: module.InteractionNetwork };
});

const DISPLAY_OPTIONS = [
  { value: "list", label: "List", icon: <List className="size-4" aria-hidden /> },
  { value: "network", label: "Network", icon: <Share2 className="size-4" aria-hidden /> },
] as const;

function EmptyExplore({
  query,
  mode,
  qThreshold,
  significantOnly,
  onClearQuery,
  onShowRanked,
}: {
  query: string;
  mode: AtlasMode;
  qThreshold: number;
  significantOnly: boolean;
  onClearQuery: () => void;
  onShowRanked: () => void;
}) {
  const searched = query.trim().length > 0;
  return (
    <div className="surface-card py-20 text-center">
      <p className="text-xl font-semibold">
        {searched
          ? "No pairs match that gene."
          : mode === "consensus"
            ? "No pairs meet these consensus settings."
            : significantOnly
              ? `No pairs meet q < ${qThreshold}.`
              : "No pairs in this background."}
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
  minIdentifiedBmrs,
  minSignificantBmrs,
  significantOnly,
  onDisplayChange,
  onSignificantOnlyChange,
  onSelect,
  customize,
  likelyPassengers,
  highlightLikelyPassengers,
}: {
  data: CohortData;
  mode: AtlasMode;
  display: ExploreDisplay;
  qThreshold: number;
  minIdentifiedBmrs: BmrCount;
  minSignificantBmrs: BmrCount;
  significantOnly: boolean;
  onDisplayChange: (display: ExploreDisplay) => void;
  onSignificantOnlyChange: (significantOnly: boolean) => void;
  onSelect: (result: InteractionResult) => void;
  customize: ReactNode;
  likelyPassengers: ReadonlySet<string>;
  highlightLikelyPassengers: boolean;
}) {
  const [query, setQuery] = useState("");
  useEffect(() => setQuery(""), [data.id]);
  const results = useMemo(
    () => exploreResults(data, mode, {
      qThreshold,
      minIdentifiedBmrs,
      minSignificantBmrs,
      significantOnly,
    }),
    [
      data,
      minIdentifiedBmrs,
      minSignificantBmrs,
      mode,
      qThreshold,
      significantOnly,
    ],
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
      <ResultsToolbar
        controls={(
          <>
            <SegmentedControl
              value={display}
              options={DISPLAY_OPTIONS}
              onChange={onDisplayChange}
              label="Explore display"
            />
            <Button
              type="button"
              variant="filter"
              size="sm"
              aria-pressed={significantOnly}
              onClick={() => onSignificantOnlyChange(!significantOnly)}
            >
              {significantOnly
                ? <Check className="size-4" aria-hidden />
                : <ListFilter className="size-4" aria-hidden />}
              Significant only
            </Button>
          </>
        )}
        search={(
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Find a gene"
            label="Find a gene"
          />
        )}
        customize={customize}
      />

      {visibleResults.length === 0 ? (
        <EmptyExplore
          query={query}
          mode={mode}
          qThreshold={qThreshold}
          significantOnly={significantOnly}
          onClearQuery={() => setQuery("")}
          onShowRanked={() => onSignificantOnlyChange(false)}
        />
      ) : display === "network" ? (
        <div className="view-enter" key="network">
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
              minIdentifiedBmrs={minIdentifiedBmrs}
              minSignificantBmrs={minSignificantBmrs}
              likelyPassengers={likelyPassengers}
              highlightLikelyPassengers={highlightLikelyPassengers}
              onSelect={onSelect}
            />
          </Suspense>
        </div>
      ) : (
        <div className="view-enter" key="list">
          <InteractionList
            results={visibleResults}
            mode={mode}
            qThreshold={qThreshold}
            minIdentifiedBmrs={minIdentifiedBmrs}
            minSignificantBmrs={minSignificantBmrs}
            likelyPassengers={likelyPassengers}
            highlightLikelyPassengers={highlightLikelyPassengers}
            onSelect={onSelect}
          />
        </div>
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
