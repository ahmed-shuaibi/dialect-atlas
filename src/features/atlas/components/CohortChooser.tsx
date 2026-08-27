import { useId, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
      className="focus-ring group flex w-full items-center gap-4 rounded-[12px] border border-transparent px-4 py-3 text-left transition-colors hover:border-line hover:bg-paper"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold tracking-[-0.015em] text-ink">
          {cohort.cancer}
        </p>
        <p className="mt-1 truncate text-xs text-muted">
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
  autoFocus = false,
}: {
  cohorts: CohortMeta[];
  onSelect: (id: string) => void;
  autoFocus?: boolean;
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
      <div className="border-b border-line p-3 sm:p-4">
        <label className="focus-within:ring-brand flex items-center gap-3 rounded-[12px] border border-line bg-white/65 px-4 focus-within:ring-[3px]">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="sr-only">Search cancers and cohorts</span>
          <input
            autoFocus={autoFocus}
            role="combobox"
            aria-label="Cancer and cohort search"
            aria-controls={resultsId}
            aria-expanded={Boolean(queryValue)}
            aria-autocomplete="list"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search any cancer or cohort"
            className="h-12 w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-muted"
          />
        </label>
      </div>

      <div id={resultsId} className="max-h-[min(58vh,32rem)] overflow-y-auto p-3 sm:p-4">
        {queryValue ? (
          <div>
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {searchResults.length} {searchResults.length === 1 ? "match" : "matches"}
            </p>
            {searchResults.length > 0 ? (
              <div className="grid gap-0.5 sm:grid-cols-2">
                {searchResults.map((cohort) => (
                  <CohortOption key={cohort.id} cohort={cohort} onSelect={onSelect} showFamily />
                ))}
              </div>
            ) : (
              <p className="px-3 py-12 text-center text-sm text-muted">No matching cancer or cohort.</p>
            )}
          </div>
        ) : activeFamily ? (
          <div>
            <button
              type="button"
              onClick={() => setFamilyId(null)}
              className="focus-ring mb-3 inline-flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-xs font-semibold text-muted hover:bg-sand hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              All cancer types
            </button>
            <div className="mb-2 px-2">
              <p className="text-lg font-semibold tracking-[-0.02em]">{activeFamily.label}</p>
              <p className="mt-1 text-xs text-muted">Choose a study cohort.</p>
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
              <p className="text-sm font-semibold">Choose a cancer type</p>
              <p className="text-[11px] text-muted">Then choose a study cohort</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {families.map((family) => (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => setFamilyId(family.id)}
                  className="focus-ring group min-h-24 rounded-[12px] border border-line bg-white/35 p-4 text-left transition-colors hover:border-ink/25 hover:bg-white/75"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold tracking-[-0.015em] text-ink">
                      {family.label}
                    </span>
                    <span className="font-mono text-[10px] text-muted">{family.count}</span>
                  </span>
                  <span className="mt-2 block text-[11px] leading-4 text-muted">
                    {family.description}
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
        <p className="mx-auto mt-4 max-w-xl text-balance text-[17px] leading-7 text-muted">
          Find significant gene interactions by cancer type and study cohort.
        </p>
      </div>
      <div className="surface-card mx-auto w-full max-w-5xl overflow-hidden text-left">
        <CohortPicker cohorts={cohorts} onSelect={onSelect} autoFocus />
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
        <Button variant="outline" size="sm" className="rounded-[10px]">
          Change cohort
          <ChevronsUpDown className="size-3.5" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl overflow-hidden rounded-[16px] p-0 sm:rounded-[16px] sm:p-0">
        <div className="px-6 pb-4 pt-6 sm:px-8 sm:pt-7">
          <DialogTitle>Choose a cohort</DialogTitle>
          <DialogDescription className="mt-1.5">
            Start with a cancer type, or search the full release.
          </DialogDescription>
        </div>
        <div className="border-t border-line">
          <CohortPicker
            cohorts={cohorts}
            autoFocus
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
