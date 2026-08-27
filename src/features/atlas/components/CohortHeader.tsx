import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { ChangeCohortButton } from "@/features/atlas/components/CohortChooser";
import { BMR_LABEL, fmtInt, STUDY_LABEL } from "@/features/atlas/lib/atlas-transform";
import type { AtlasMode, CohortMeta } from "@/features/atlas/types";

function countValue(value: number | null | undefined): string {
  return value == null ? "—" : fmtInt(value);
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 bg-paper px-4 py-3.5 sm:px-5">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.11em] text-muted">{label}</dt>
      <dd className="mt-1.5 min-w-0 text-[13px] font-semibold tracking-[-0.01em] text-ink">
        {children}
      </dd>
    </div>
  );
}

export function CohortHeader({
  cohort,
  cohorts,
  mode,
  onCohortChange,
  settings,
  significantMeCount,
  significantCoCount,
}: {
  cohort: CohortMeta;
  cohorts: CohortMeta[];
  mode: AtlasMode;
  onCohortChange: (id: string) => void;
  settings: ReactNode;
  significantMeCount?: number | null;
  significantCoCount?: number | null;
}) {
  const activeBackground = mode === "consensus" ? "All 3 backgrounds" : BMR_LABEL[mode];
  return (
    <header className="pb-7 pt-8 sm:pb-9 sm:pt-11">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h1 className="max-w-[21ch] text-[clamp(2.2rem,5.3vw,4.9rem)] font-[760] leading-[0.96] tracking-[-0.055em]">
          {cohort.cancer}
        </h1>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="font-mono text-[10px] font-semibold text-muted">
            {activeBackground} · q &lt; 0.01
          </p>
          <div className="flex items-center gap-1.5">
            <ChangeCohortButton cohorts={cohorts} onSelect={onCohortChange} />
            {settings}
          </div>
        </div>
      </div>

      <p className="sr-only">Current result basis: {activeBackground}, q below 0.01.</p>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line shadow-[0_1px_2px_rgba(24,32,37,0.035)] sm:grid-cols-3 lg:grid-cols-6">
        <Fact label="Study">{STUDY_LABEL[cohort.study] ?? cohort.study}</Fact>
        <Fact label="Samples">
          <span className="font-mono">{fmtInt(cohort.n_samples)}</span>
        </Fact>
        <Fact label="Median mutations">
          <span className="font-mono">{fmtInt(cohort.median_mutations)}</span>
        </Fact>
        <Fact label="Significant ME">
          <span className="font-mono">{countValue(significantMeCount)}</span>
        </Fact>
        <Fact label="Significant CO">
          <span className="font-mono">{countValue(significantCoCount)}</span>
        </Fact>
        <Fact label="Source">
          {cohort.cbio ? (
            <a
              href={cohort.cbio}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center gap-1 rounded-[6px] text-brand underline decoration-brand/25 underline-offset-4 hover:decoration-brand"
            >
              cBioPortal <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : (
            <span className="text-muted">Not available</span>
          )}
        </Fact>
      </dl>
    </header>
  );
}
