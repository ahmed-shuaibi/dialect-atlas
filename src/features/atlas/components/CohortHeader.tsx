import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { ChangeCohortButton } from "@/features/atlas/components/CohortChooser";
import { fmtInt, STUDY_LABEL } from "@/features/atlas/lib/atlas-transform";
import type { CohortMeta } from "@/features/atlas/types";

export function CohortHeader({
  cohort,
  cohorts,
  onCohortChange,
  settings,
}: {
  cohort: CohortMeta;
  cohorts: CohortMeta[];
  onCohortChange: (id: string) => void;
  settings: ReactNode;
}) {
  return (
    <header className="pb-7 pt-8 sm:pb-9 sm:pt-11">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <h1 className="max-w-[21ch] text-[clamp(2.5rem,5.5vw,5.1rem)] font-[650] leading-[0.98] tracking-[-0.045em]">
              {cohort.cancer}
            </h1>
            <ChangeCohortButton cohorts={cohorts} onSelect={onCohortChange} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-muted sm:text-[15px]">
            <span>{STUDY_LABEL[cohort.study] ?? cohort.study}</span>
            <span aria-hidden>·</span>
            <span><span className="font-mono text-[0.92em] text-ink">{fmtInt(cohort.n_samples)}</span> tumors</span>
            <span aria-hidden>·</span>
            <span>median <span className="font-mono text-[0.92em] text-ink">{fmtInt(cohort.median_mutations)}</span> mutations/tumor</span>
            {cohort.cbio && (
              <>
                <span aria-hidden>·</span>
                <a
                  href={cohort.cbio}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex items-center gap-1 rounded-full text-brand hover:underline"
                >
                  cBioPortal <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </>
            )}
          </div>
        </div>
        <div className="shrink-0">{settings}</div>
      </div>
    </header>
  );
}
