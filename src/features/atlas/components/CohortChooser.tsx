import { useId, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Replace } from "lucide-react";
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
  CANCER_FAMILIES,
  type CancerFamilyId,
  cohortsForFamily,
  familyForCohort,
} from "@/features/atlas/lib/cohort-taxonomy";
import { fmtInt, STUDY_LABEL } from "@/features/atlas/lib/atlas-transform";
import type { CohortMeta } from "@/features/atlas/types";

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function CohortOption({
  cohort,
  onSelect,
  showFamily = false,
}: {
  cohort: CohortMeta;
  onSelect: (id: string) => void;
  showFamily?: boolean;
}) {
  const family = familyForCohort(cohort.id);
  return (
    <button
      type="button"
      onClick={() => onSelect(cohort.id)}
      className="focus-ring group flex w-full items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left transition-colors hover:border-line hover:bg-sand/60"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-ink">
          {cohort.cancer}
        </p>
        <p className="mt-1 truncate text-sm text-muted">
          {STUDY_LABEL[cohort.study] ?? cohort.study} · {fmtInt(cohort.n_samples)} samples
          {showFamily && family ? ` · ${family.label}` : ""}
        </p>
      </div>
      <ArrowRight
        className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
        aria-hidden
      />
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
  const [familyId, setFamilyId] = useState<CancerFamilyId | null>(null);
  const [query, setQuery] = useState("");
  const resultsId = useId();
  const queryValue = normalized(query);
  const availableIds = useMemo(() => new Set(cohorts.map((cohort) => cohort.id)), [cohorts]);
  const families = useMemo(
    () =>
      CANCER_FAMILIES.map((family) => ({
        ...family,
        count: family.cohortIds.filter((id) => availableIds.has(id)).length,
      })).filter((family) => family.count > 0),
    [availableIds],
  );
  const searchResults = useMemo(() => {
    if (!queryValue) return [];
    return [...cohorts]
      .filter((cohort) => {
        const family = familyForCohort(cohort.id);
        return normalized(
          [cohort.cancer, cohort.cohort, cohort.study, cohort.id, family?.label ?? ""].join(" "),
        ).includes(queryValue);
      })
      .sort((a, b) => a.cancer.localeCompare(b.cancer) || a.study.localeCompare(b.study));
  }, [cohorts, queryValue]);
  const familyCohorts = familyId ? cohortsForFamily(cohorts, familyId) : [];
  const activeFamily = families.find((family) => family.id === familyId) ?? null;

  return (
    <div className="bg-paper">
      <div className="border-b border-line p-4 sm:p-5">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search cancers or cohorts"
          label="Cancer and cohort search"
        />
      </div>

      <div id={resultsId} className="max-h-[min(58vh,32rem)] overflow-y-auto p-3 sm:p-4">
        {queryValue ? (
          <div>
            <p className="px-2 pb-2 text-xs font-semibold text-muted">
              {searchResults.length} {searchResults.length === 1 ? "match" : "matches"}
            </p>
            {searchResults.length > 0 ? (
              <div className="grid gap-0.5 sm:grid-cols-2">
                {searchResults.map((cohort) => (
                  <CohortOption key={cohort.id} cohort={cohort} onSelect={onSelect} showFamily />
                ))}
              </div>
            ) : (
              <p className="px-3 py-12 text-center text-base text-muted">No matching cancer or cohort.</p>
            )}
          </div>
        ) : activeFamily ? (
          <div>
            <button
              type="button"
              onClick={() => setFamilyId(null)}
              className="focus-ring mb-3 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-muted hover:bg-sand hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              All cancer types
            </button>
            <div className="mb-2 px-2">
              <p className="text-xl font-semibold">{activeFamily.label}</p>
              <p className="mt-1 text-sm text-muted">Choose a study cohort.</p>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-2">
              {familyCohorts.map((cohort) => (
                <CohortOption key={cohort.id} cohort={cohort} onSelect={onSelect} />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-baseline justify-between gap-3 px-2">
              <p className="text-base font-semibold">Choose a cancer group</p>
              <p className="text-sm text-muted">Then choose a cohort</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {families.map((family) => (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => setFamilyId(family.id)}
                  className="focus-ring group min-h-20 rounded-2xl border border-line bg-canvas/40 p-4 text-left transition-colors hover:border-ink/25 hover:bg-sand"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-base font-semibold text-ink">
                      {family.label}
                    </span>
                    <span className="font-mono text-xs text-muted">{family.count}</span>
                  </span>
                </button>
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
        <h1 className="mx-auto max-w-[16ch] text-[clamp(2.7rem,7vw,5rem)] font-[760] leading-[0.96] tracking-[-0.055em]">
          Choose a cancer.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-lg leading-8 text-muted">
          Explore ranked gene interactions by cancer type and cohort.
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
        <Button variant="soft" size="sm" aria-label="Change cancer or cohort">
          <Replace className="size-4" aria-hidden />
          Change
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl overflow-hidden rounded-[28px] p-0 sm:rounded-[28px] sm:p-0">
        <div className="px-6 pb-4 pt-6 sm:px-8 sm:pt-7">
          <DialogTitle>Choose cancer or cohort</DialogTitle>
          <DialogDescription className="mt-1.5">Browse by group or search directly.</DialogDescription>
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
