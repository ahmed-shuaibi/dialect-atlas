import { useMemo, useState } from "react";
import { ArrowRight, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fmtInt, STUDY_LABEL } from "@/features/atlas/lib/atlas-transform";
import type { CohortMeta } from "@/features/atlas/types";

function CohortCommand({
  cohorts,
  onSelect,
}: {
  cohorts: CohortMeta[];
  onSelect: (id: string) => void;
}) {
  const ordered = useMemo(
    () => [...cohorts].sort((a, b) => a.cancer.localeCompare(b.cancer) || a.study.localeCompare(b.study)),
    [cohorts],
  );

  return (
    <Command label="Cancer and cohort search">
      <CommandInput autoFocus aria-label="Search cancers and cohorts" placeholder="Search cancer or cohort…" />
      <CommandList>
        <CommandEmpty>No matching cancer or cohort.</CommandEmpty>
        {ordered.map((cohort) => (
          <CommandItem
            key={cohort.id}
            value={`${cohort.cancer} ${cohort.cohort} ${cohort.study} ${cohort.id}`}
            onSelect={() => onSelect(cohort.id)}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold tracking-tight">{cohort.cancer}</p>
              <p className="mt-0.5 truncate text-xs font-medium text-muted">
                {STUDY_LABEL[cohort.study] ?? cohort.study} · {fmtInt(cohort.n_samples)} samples
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
          </CommandItem>
        ))}
      </CommandList>
    </Command>
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
    <section className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-4xl flex-col justify-center px-5 py-16 text-center">
      <p className="eyebrow">DIALECT interaction atlas</p>
      <h1 className="mx-auto mt-5 max-w-[15ch] text-balance text-[clamp(3rem,8vw,6.8rem)] font-black leading-[0.92] tracking-[-0.065em]">
        Choose a cancer.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-7 text-muted">
        See the strongest mutually exclusive and co-occurring gene-effect pairs, side by side.
      </p>
      <div className="mx-auto mt-10 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-line bg-paper text-left shadow-soft">
        <CohortCommand cohorts={cohorts} onSelect={onSelect} />
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
        <Button variant="outline" size="sm">
          Change cancer
          <ChevronsUpDown className="size-3.5" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 sm:p-0">
        <div className="px-6 pb-4 pt-6 sm:px-8 sm:pt-8">
          <DialogTitle>Choose a cancer</DialogTitle>
          <DialogDescription className="mt-2">Search across every cohort in this release.</DialogDescription>
        </div>
        <div className="border-t border-line">
          <CohortCommand
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
