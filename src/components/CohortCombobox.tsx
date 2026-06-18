import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import type { Atlas, Cohort } from "@/lib/atlas";

export const prettyCohort = (c: Cohort) => c.cohort.replace(/_/g, " ");

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
    const m = new Map<string, Cohort[]>();
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
        <button
          role="combobox"
          aria-expanded={open}
          className="focus-ring flex h-9 w-[280px] items-center justify-between gap-2 rounded-md border border-border bg-white/[0.04] px-3 text-sm outline-none transition-colors hover:bg-white/[0.06]"
        >
          {selected ? (
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-mono text-foreground">{prettyCohort(selected)}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{selected.study}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select a cohort…</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px]" align="start">
        <Command>
          <CommandInput placeholder="Search 69 cohorts…" />
          <CommandList>
            <CommandEmpty>No cohort found.</CommandEmpty>
            {groups.map(([study, list]) => (
              <CommandGroup key={study} heading={study}>
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
