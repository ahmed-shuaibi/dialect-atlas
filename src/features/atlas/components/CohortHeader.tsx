import { ChangeCohortButton } from "@/features/atlas/components/CohortChooser";
import { studyLabel } from "@/features/atlas/lib/atlas-metadata";
import { fmtInt } from "@/features/atlas/lib/atlas-transform";
import type { AtlasView, CohortMeta } from "@/features/atlas/types";

type ResultsView = Extract<AtlasView, "explore" | "compare">;

export function CohortHeader({
  view,
  cohort,
  cohorts,
  onCohortChange,
}: {
  view: ResultsView;
  cohort: CohortMeta;
  cohorts: CohortMeta[];
  onCohortChange: (id: string) => void;
}) {
  const pageLabel = view === "explore" ? "Explore" : "Compare";
  return (
    <header className="pb-6 pt-8 sm:pb-7 sm:pt-11">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <h1
          aria-label={`${pageLabel} / ${cohort.cancer}`}
          className="w-full min-w-0 text-[clamp(2.15rem,5vw,4.4rem)] font-[650] leading-[0.98] tracking-[-0.045em] sm:w-auto"
        >
          <span className="text-muted">{pageLabel}</span>
          <span className="mx-[0.22em] font-normal text-line" aria-hidden>/</span>
          <span className="mt-1 block sm:mt-0 sm:inline">{cohort.cancer}</span>
        </h1>
        <ChangeCohortButton cohorts={cohorts} onSelect={onCohortChange} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Cohort summary">
        <span className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-semibold text-muted shadow-sm">
          {studyLabel(cohort.study)}
        </span>
        <span className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-semibold text-muted shadow-sm">
          <span className="font-mono text-[0.92em] text-ink">{fmtInt(cohort.n_samples)}</span> tumors
        </span>
      </div>
    </header>
  );
}
