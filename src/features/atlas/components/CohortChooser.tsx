import { ArrowLeft, ArrowRight, Replace } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SearchField } from "@/components/ui/search-field";
import {
  STUDIES,
  cohortTag,
  studyLabel,
  type StudyId,
} from "@/features/atlas/lib/atlas-metadata";
import { fmtInt } from "@/features/atlas/lib/atlas-transform";
import type { CohortMeta } from "@/features/atlas/types";

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function CohortOption({
  cohort,
  onSelect,
  showStudy = false,
}: {
  cohort: CohortMeta;
  onSelect: (id: string) => void;
  showStudy?: boolean;
}) {
  const tag = cohortTag(cohort);
  return (
    <button
      type="button"
      onClick={() => onSelect(cohort.id)}
      className="focus-ring group flex w-full items-center gap-4 rounded-[20px] border border-transparent px-4 py-3.5 text-left transition-colors hover:border-line hover:bg-sand/65"
      aria-label={`${cohort.cancer}, ${tag}, ${studyLabel(cohort.study)}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold text-ink">{cohort.cancer}</p>
          <span
            title={tag}
            className="max-w-64 truncate rounded-full bg-sand px-2 py-0.5 font-mono text-[11px] font-medium text-muted"
          >
            {tag}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {showStudy && `${studyLabel(cohort.study)} · `}{fmtInt(cohort.n_samples)} tumors
        </p>
      </div>
      <ArrowRight
        className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
        aria-hidden
      />
    </button>
  );
}

function StudyOption({
  study,
  count,
  onSelect,
}: {
  study: (typeof STUDIES)[number];
  count: number;
  onSelect: (id: StudyId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(study.id)}
      className="focus-ring group flex min-h-28 items-center justify-between rounded-[22px] border border-line bg-canvas/45 p-5 text-left transition-colors hover:border-ink/25 hover:bg-sand"
    >
      <span>
        <span className="block text-xl font-semibold text-ink">{study.label}</span>
        <span className="mt-2 block text-sm text-muted">
          {count} {count === 1 ? "cancer type" : "cancer types"}
        </span>
      </span>
      <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
    </button>
  );
}

function CohortPicker({
  cohorts,
  onSelect,
}: {
  cohorts: CohortMeta[];
  onSelect: (id: string) => void;
}) {
  const [studyId, setStudyId] = useState<StudyId | null>(null);
  const [query, setQuery] = useState("");
  const queryValue = normalize(query);
  const studies = useMemo(
    () => STUDIES.map((study) => ({
      ...study,
      cohorts: cohorts.filter((cohort) => cohort.study === study.id),
    })).filter((study) => study.cohorts.length > 0),
    [cohorts],
  );
  const activeStudy = studies.find((study) => study.id === studyId) ?? null;
  const searchResults = useMemo(() => {
    if (!queryValue) return [];
    return cohorts
      .filter((cohort) => normalize([
        cohort.cancer,
        cohort.cohort,
        cohortTag(cohort),
        studyLabel(cohort.study),
      ].join(" ")).includes(queryValue))
      .sort((a, b) => a.study.localeCompare(b.study) || a.cancer.localeCompare(b.cancer));
  }, [cohorts, queryValue]);

  return (
    <div className="bg-paper">
      <div className="border-b border-line p-4 sm:p-5">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search study or cancer"
          label="Search study or cancer"
        />
      </div>

      <div className="max-h-[min(62vh,34rem)] overflow-y-auto p-3 sm:p-4">
        {queryValue ? (
          <div>
            <p className="px-2 pb-2 text-xs font-semibold text-muted">
              {searchResults.length} {searchResults.length === 1 ? "match" : "matches"}
            </p>
            {searchResults.length > 0 ? (
              <div className="grid gap-0.5 sm:grid-cols-2">
                {searchResults.map((cohort) => (
                  <CohortOption key={cohort.id} cohort={cohort} onSelect={onSelect} showStudy />
                ))}
              </div>
            ) : (
              <p className="px-3 py-12 text-center text-base text-muted">No matching cohort.</p>
            )}
          </div>
        ) : activeStudy ? (
          <div>
            <button
              type="button"
              onClick={() => setStudyId(null)}
              className="focus-ring mb-3 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-muted hover:bg-sand hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              All studies
            </button>
            <div className="mb-2 px-2">
              <p className="text-xl font-semibold">{activeStudy.label}</p>
              <p className="mt-1 text-sm text-muted">Choose a cancer type.</p>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-2">
              {[...activeStudy.cohorts]
                .sort((a, b) => a.cancer.localeCompare(b.cancer))
                .map((cohort) => (
                  <CohortOption key={cohort.id} cohort={cohort} onSelect={onSelect} />
                ))}
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-3 px-2 text-base font-semibold">Choose a study</p>
            <div className="grid gap-2 md:grid-cols-3">
              {studies.map((study) => (
                <StudyOption
                  key={study.id}
                  study={study}
                  count={study.cohorts.length}
                  onSelect={setStudyId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function InitialCohortChooser({
  cohorts,
  onSelect,
}: {
  cohorts: CohortMeta[];
  onSelect: (id: string) => void;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col justify-center px-5 py-12">
      <div className="mb-8 text-center">
        <h1 className="mx-auto max-w-[16ch] text-[clamp(2.7rem,7vw,5rem)] font-[650] leading-[0.96] tracking-[-0.05em]">
          Choose a study.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-lg leading-8 text-muted">
          Then choose a cancer type.
        </p>
      </div>
      <div className="surface-card mx-auto w-full max-w-5xl overflow-hidden text-left">
        <CohortPicker cohorts={cohorts} onSelect={onSelect} />
      </div>
    </section>
  );
}

export function ChangeCohortButton({
  cohorts,
  onSelect,
}: {
  cohorts: CohortMeta[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="soft" size="header" aria-label="Change study or cancer">
          <Replace className="size-4" aria-hidden />
          Change
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl overflow-hidden rounded-[28px] p-0 sm:rounded-[28px] sm:p-0">
        <div className="px-6 pb-4 pt-6 pr-16 sm:px-8 sm:pt-7 sm:pr-20">
          <DialogTitle>Choose a cohort</DialogTitle>
          <DialogDescription className="mt-1.5">Study first, then cancer type.</DialogDescription>
        </div>
        <div className="border-t border-line">
          <CohortPicker
            cohorts={cohorts}
            onSelect={(id) => {
              onSelect(id);
              setOpen(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
