import { useEffect, useMemo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { AboutView } from "@/features/atlas/components/AboutView";
import { CohortHeader } from "@/features/atlas/components/CohortHeader";
import { CompareView } from "@/features/atlas/components/CompareView";
import { InitialCohortChooser } from "@/features/atlas/components/CohortChooser";
import { ExploreView, ResultsSkeleton } from "@/features/atlas/components/ExploreView";
import { PairDialog } from "@/features/atlas/components/PairDialog";
import { SettingsDrawer } from "@/features/atlas/components/SettingsDrawer";
import { useCohort, useRelease } from "@/features/atlas/hooks/useAtlas";
import {
  findResult,
  findResultForMode,
  parsePairId,
} from "@/features/atlas/lib/atlas-transform";
import type { InteractionResult } from "@/features/atlas/types";
import { useHashState } from "@/lib/useHashState";

function FullPageLoading() {
  return (
    <main id="main" tabIndex={-1} className="site-shell flex min-h-[70vh] items-center justify-center" role="status">
      <div className="w-full max-w-xl space-y-4 text-center">
        <div className="mx-auto h-4 w-32 animate-pulse rounded-full bg-ink/[0.07]" />
        <div className="mx-auto h-20 w-full animate-pulse rounded-[2rem] bg-paper" />
        <p className="text-sm font-semibold text-muted">Loading the immutable release…</p>
      </div>
    </main>
  );
}

function ErrorState({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto my-20 max-w-2xl rounded-[2rem] border border-alert/20 bg-paper p-8 text-center shadow-soft">
      <AlertTriangle className="mx-auto size-7 text-alert" aria-hidden />
      <h1 className="mt-4 text-2xl font-black tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        The Atlas will not substitute another release or invent missing results. Please retry or inspect the immutable release files.
      </p>
      {error && <p className="mt-4 break-words rounded-xl bg-sand p-3 font-mono text-[11px] leading-5 text-muted">{error}</p>}
      <Button className="mt-6" onClick={onRetry}>
        <RefreshCw className="size-4" aria-hidden />
        Retry
      </Button>
    </div>
  );
}

export function App() {
  const [url, setUrl] = useHashState();
  const release = useRelease();
  const cohortMeta = release.data?.index.cohorts.find((cohort) => cohort.id === url.cohort) ?? null;
  const shouldLoadCohort = url.view !== "about" && cohortMeta != null;
  const cohort = useCohort(shouldLoadCohort ? cohortMeta : null);
  const selection = useMemo(() => parsePairId(url.pair), [url.pair]);
  const selectedResult = useMemo(
    () =>
      cohort.data && selection
        ? url.view === "compare"
          ? findResult(cohort.data, selection)
          : findResultForMode(cohort.data, selection, url.mode, {
              qThreshold: url.qThreshold,
              significantOnly: url.significantOnly,
            })
        : null,
    [cohort.data, selection, url.mode, url.qThreshold, url.significantOnly, url.view],
  );

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [url.cohort, url.view]);

  useEffect(() => {
    if (url.pair && cohort.status === "ready" && !selectedResult) {
      setUrl({ pair: undefined }, { replace: true });
    }
  }, [cohort.status, selectedResult, setUrl, url.pair]);

  const chooseCohort = (id: string) => {
    setUrl({ cohort: id, pair: undefined, settings: false });
  };
  const selectPair = (result: InteractionResult) => setUrl({ pair: result.id });

  return (
    <div className="min-h-screen">
      <SiteNav state={url} />

      {release.status === "loading" && <FullPageLoading />}
      {release.status === "error" && (
        <main id="main" tabIndex={-1} className="site-shell">
          <ErrorState title="Release data unavailable" error={release.error} onRetry={release.retry} />
        </main>
      )}

      {release.data && (
        <main id="main" tabIndex={-1} className="outline-none">
          {url.view === "about" ? (
            <div className="site-shell">
              <AboutView bundle={release.data} cohort={cohortMeta} />
            </div>
          ) : !url.cohort || !cohortMeta ? (
            <>
              {url.cohort && (
                <p role="alert" className="site-shell pt-8 text-center text-sm font-bold text-alert">
                  That cohort is not part of this immutable release. Choose another.
                </p>
              )}
              <InitialCohortChooser cohorts={release.data.index.cohorts} onSelect={chooseCohort} />
            </>
          ) : (
            <div className="site-shell pb-16">
              <CohortHeader
                cohort={cohortMeta}
                cohorts={release.data.index.cohorts}
                onCohortChange={chooseCohort}
                settings={
                  <SettingsDrawer
                    open={url.settings}
                    mode={url.mode}
                    qThreshold={url.qThreshold}
                    onOpenChange={(settings) => setUrl({ settings }, { replace: !settings })}
                    onModeChange={(mode) => setUrl({ mode, pair: undefined })}
                    onQThresholdChange={(qThreshold) => setUrl({ qThreshold, pair: undefined })}
                  />
                }
              />

              {cohort.status === "loading" && <ResultsSkeleton />}
              {cohort.status === "error" && (
                <ErrorState title="Cohort data unavailable" error={cohort.error} onRetry={cohort.retry} />
              )}
              {cohort.data && url.view === "explore" && (
                <ExploreView
                  data={cohort.data}
                  mode={url.mode}
                  display={url.exploreDisplay}
                  qThreshold={url.qThreshold}
                  significantOnly={url.significantOnly}
                  onDisplayChange={(exploreDisplay) => setUrl({ exploreDisplay })}
                  onSignificantOnlyChange={(significantOnly) =>
                    setUrl({ significantOnly, pair: undefined })
                  }
                  onSelect={selectPair}
                />
              )}
              {cohort.data && url.view === "compare" && (
                <CompareView
                  data={cohort.data}
                  manifestMethods={release.data.manifest.methods}
                  qThreshold={url.qThreshold}
                  onSelect={selectPair}
                />
              )}

              {cohort.data && (
                <PairDialog
                  result={selectedResult}
                  data={cohort.data}
                  mode={url.mode}
                  qThreshold={url.qThreshold}
                  open={selectedResult != null}
                  onOpenChange={(open) => !open && setUrl({ pair: undefined }, { replace: true })}
                />
              )}
            </div>
          )}
        </main>
      )}

      <Footer releaseId={release.data?.manifest.release_id} />
    </div>
  );
}
