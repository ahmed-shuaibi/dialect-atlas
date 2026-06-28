import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn, fmtInt } from "@/lib/utils";
import { STUDY_LABEL } from "@/features/atlas/lib/atlas-transform";
import type { Atlas, CohortMeta } from "@/features/atlas/types";

export const prettyCohort = (c: CohortMeta) => c.cohort.replace(/_/g, " ");

export function CohortCombobox({
  atlas,
  value,
  onChange,
}: {
  atlas: Atlas;
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = atlas.cohorts.find((c) => c.id === value);

  const groups = useMemo(() => {
    const m = new Map<string, CohortMeta[]>();
    for (const c of atlas.cohorts) {
      const arr = m.get(c.study);
      if (arr) arr.push(c);
      else m.set(c.study, [c]);
    }
    return [...m.entries()];
  }, [atlas]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="control-width w-full justify-between gap-2 px-3 font-normal sm:w-[var(--control-width)]"
        >
          {selected ? (
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-mono text-foreground">{prettyCohort(selected)}</span>
              <span className="shrink-0 text-eyebrow text-muted-foreground-strong">
                {STUDY_LABEL[selected.study] ?? selected.study}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground-strong">Select a cohort…</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px]" align="start">
        <Command>
          <CommandInput placeholder="Search 69 cohorts…" />
          <CommandList>
            <CommandEmpty>No cohort found.</CommandEmpty>
            {groups.map(([study, list]) => (
              <CommandGroup key={study} heading={STUDY_LABEL[study] ?? study}>
                {list.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.cohort} ${c.study}`}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0 text-brand",
                        c.id === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate font-mono text-[13px] text-foreground">
                      {prettyCohort(c)}
                    </span>
                    <Badge variant="count" className="ml-auto tnum">
                      N={fmtInt(c.n_samples)}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
