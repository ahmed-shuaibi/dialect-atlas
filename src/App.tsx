import { useCallback, useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useHashState } from "@/lib/useHashState";
import {
  AtlasControls,
  CrossModelStrip,
  EditorialHeader,
  NetworkView,
  ResultTable,
  VIEW_DEFAULTS,
  resolveCohort,
  useAtlas,
  useAtlasView,
  useCohort,
  type Bmr,
  type DirFilter,
  type NetSelection,
} from "@/features/atlas";

/** Wide shell capped at one container token; consistent gutter. */
const SHELL = "mx-auto w-full max-w-[1320px] px-5 sm:px-8";

export function App() {
  const { atlas, error } = useAtlas();
  const [hash, setHash] = useHashState({ ...VIEW_DEFAULTS });
  const [selected, setSelected] = useState<NetSelection | null>(null);

  const onSelect = useCallback((s: NetSelection | null) => setSelected(s), []);
  useEffect(() => setSelected(null), [hash.c, hash.b, hash.d, hash.f]);

  // Resolve the selected cohort from the index, then lazily hydrate its heavy shard (edges).
  const cohortMeta = atlas ? resolveCohort(hash, atlas) : null;
  const { cohort: hydrated, error: cohortError } = useCohort(cohortMeta);
  const view = useAtlasView(hash, atlas, hydrated);

  if (error || cohortError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-meta text-muted-foreground-strong">
        Failed to load atlas data.
      </div>
    );
  }

  if (!atlas || !view) {
    return (
      <>
        <SiteNav />
        <main className={`${SHELL} space-y-section pt-page-top`}>
          <div className="max-w-[680px] space-y-caption">
            <div className="h-9 w-72 animate-pulse rounded-md bg-white/[0.04]" />
            <div className="h-20 w-full animate-pulse rounded-md bg-white/[0.03]" />
          </div>
          <div className="flex flex-col gap-control-row sm:flex-row">
            <div className="h-14 w-full animate-pulse rounded-md bg-white/[0.03] sm:w-[var(--control-width)]" />
            <div className="h-14 w-full animate-pulse rounded-md bg-white/[0.03] sm:w-[var(--control-width)]" />
            <div className="h-14 w-full animate-pulse rounded-md bg-white/[0.03] sm:w-[var(--control-width)]" />
          </div>
          {/* dependency network — the hero visual, shares the network height token (no CLS) */}
          <div className="h-network w-full animate-pulse rounded-lg bg-white/[0.03]" />
          {/* cross-model strip (3-up) */}
          <div className="grid grid-cols-1 gap-control-row sm:grid-cols-3">
            <div className="h-40 w-full animate-pulse rounded-lg bg-white/[0.03]" />
            <div className="h-40 w-full animate-pulse rounded-lg bg-white/[0.03]" />
            <div className="h-40 w-full animate-pulse rounded-lg bg-white/[0.03]" />
          </div>
          {/* ranked table */}
          <div className="h-80 w-full animate-pulse rounded-lg bg-white/[0.03]" />
        </main>
      </>
    );
  }

  const { cohort, bmr, dir, excludePassengers, net, rows } = view;
  const nModels = atlas.bmrs.filter((b) => cohort.bmrs[b]).length;

  return (
    <TooltipProvider delayDuration={150}>
      <SiteNav />
      <main className={`${SHELL} space-y-section pb-page-top pt-page-top`}>
        <EditorialHeader cohorts={atlas.cohorts.length} models={atlas.bmrs.length} />

        <AtlasControls
          atlas={atlas}
          cohort={cohort}
          bmr={bmr}
          dir={dir}
          excludePassengers={excludePassengers}
          onCohortChange={(c) => setHash({ c })}
          onBmrChange={(b: Bmr) => setHash({ b })}
          onDirChange={(d: DirFilter) => setHash({ d })}
          onExcludePassengersChange={(next) => setHash({ f: next ? undefined : "0" })}
        />

        {/* Dependency network — the hero visual, leading the page */}
        <section aria-label="Dependency network" className="space-y-caption">
          <h2 className="eyebrow">dependency network</h2>
          {net.empty ? (
            <div className="canvas-surface flex h-network flex-col items-center justify-center gap-label p-8 text-center">
              <p className="font-serif text-h2 text-foreground">No dependencies to show</p>
              <p className="max-w-[40ch] text-meta text-muted-foreground-strong">
                No pairs for this cohort, model, and filter. Try another model or change the Show
                filter.
              </p>
            </div>
          ) : (
            <NetworkView
              elements={net.elements}
              minW={net.minW}
              maxW={net.maxW}
              selected={selected}
              onSelect={onSelect}
            />
          )}
        </section>

        <CrossModelStrip atlas={atlas} cohort={cohort} bmr={bmr} dir={dir} />

        {/* Ranked dependencies — the analytical backbone below the visual */}
        <section aria-label="Ranked dependencies" className="space-y-caption">
          <h2 className="eyebrow">ranked dependencies</h2>
          <ResultTable
            key={dir}
            rows={rows}
            selected={selected}
            onSelect={onSelect}
            nModels={nModels}
            defaultSort={dir === "ME" ? { key: "rho", dir: "asc" } : { key: "lrt", dir: "desc" }}
          />
        </section>
      </main>
      <Footer />
    </TooltipProvider>
  );
}
