import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ChangeCohortButton } from "@/features/atlas/components/CohortChooser";
import { BMR_LABEL, fmtInt, STUDY_LABEL } from "@/features/atlas/lib/atlas-transform";
import type { AtlasMode, CohortMeta } from "@/features/atlas/types";

export function CohortHeader({
  cohort,
  cohorts,
  mode,
  strict,
  onCohortChange,
  settings,
}: {
  cohort: CohortMeta;
  cohorts: CohortMeta[];
  mode: AtlasMode;
  strict: boolean;
  onCohortChange: (id: string) => void;
  settings: ReactNode;
}) {
  return (
    <header className="pb-8 pt-10 sm:pb-12 sm:pt-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Cancer interaction atlas</p>
        <div className="flex items-center gap-1">
          <ChangeCohortButton cohorts={cohorts} onSelect={onCohortChange} />
          {settings}
        </div>
      </div>
      <h1 className="mt-6 max-w-[16ch] text-balance text-[clamp(2.25rem,8vw,7.8rem)] font-black leading-[0.88] tracking-[-0.07em]">
        {cohort.cancer}
      </h1>
      <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-muted">
        <span>{STUDY_LABEL[cohort.study] ?? cohort.study}</span>
        <span aria-hidden>·</span>
        <span>{fmtInt(cohort.n_samples)} samples</span>
        <span aria-hidden>·</span>
        <span>{cohort.median_mutations} median mutations</span>
        {cohort.cbio ? (
          <a
            href={cohort.cbio}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-1 rounded-full underline decoration-line underline-offset-4 hover:text-ink"
          >
            cBioPortal <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{mode === "consensus" ? "All-three-BMR consensus" : BMR_LABEL[mode]}</Badge>
        {strict && <Badge className="border-support/30 bg-support-soft text-support">q &lt; 0.01 in all 3</Badge>}
      </div>
    </header>
  );
}
