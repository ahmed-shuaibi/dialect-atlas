import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EdgeSwatch } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";
import { prettyCohort } from "@/features/atlas/components/CohortCombobox";
import { BMR_LABEL, STUDY_LABEL } from "@/features/atlas/lib/atlas-transform";
import type { Atlas, Bmr, Cohort, DirFilter } from "@/features/atlas/types";

/** Show-filter segments — the leading swatch doubles as the always-visible ME/CO legend. */
const SHOW_OPTIONS: SegmentedOption<DirFilter>[] = [
  { value: "both", label: "Both" },
  { value: "ME", label: "ME", icon: <EdgeSwatch type="ME" /> },
  { value: "CO", label: "CO", icon: <EdgeSwatch type="CO" /> },
];

/** True when the event originated inside an editable field (so "/" doesn't hijack typing). */
function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export interface AtlasCommandProps {
  atlas: Atlas;
  /** Current (resolved) cohort — drives the trigger label. */
  cohort: Cohort;
  bmr: Bmr;
  dir: DirFilter;
  /** Single-select cohort → auto-closes the palette. */
  onCohortChange: (id: string) => void;
  /** Refinement → applies instantly, keeps the palette open. */
  onBmrChange: (bmr: Bmr) => void;
  /** Refinement → applies instantly, keeps the palette open. */
  onDirChange: (dir: DirFilter) => void;
}

/**
 * AtlasCommand — the ONE primary control (REDESIGN2 §2). A ⌘K command palette that folds the
 * former four dropdowns into a single affordance: cohort is a searchable, study-grouped
 * single-select `Command` list (Enter/click selects + auto-closes); model and direction ride two
 * pinned `Segmented` rows below the results, applying instantly while KEEPING the palette open
 * (they are refinements, not the primary pick). The Show swatches carry the ME-blue / CO-amber
 * glyphs, so the control doubles as the always-visible legend.
 *
 * The always-visible trigger (top-right of the header bar) shows the current cohort plus a mono
 * ⌘K hint. Opens on ⌘K, "/", or click; Esc / click-out closes (Radix Popover). State stays in the
 * URL hash upstream, so every view is shareable.
 */
export function AtlasCommand({
  atlas,
  cohort,
  bmr,
  dir,
  onCohortChange,
  onBmrChange,
  onDirChange,
}: AtlasCommandProps) {
  const [open, setOpen] = useState(false);

  // Global palette shortcuts: ⌘K / Ctrl-K toggles; "/" opens (unless typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !isEditableTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Choose cohort, model and direction"
          className="h-9 justify-between gap-3 px-3 font-normal"
        >
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-mono text-[13px] text-foreground">
              {prettyCohort(cohort)}
            </span>
            <span className="hidden shrink-0 text-eyebrow text-muted-foreground-strong sm:inline">
              {STUDY_LABEL[cohort.study] ?? cohort.study}
            </span>
          </span>
          <kbd className="pointer-events-none hidden select-none items-center rounded border border-border bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground-strong sm:inline-flex">
            ⌘K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px]" align="end">
        <Command>
          <CommandInput placeholder={`Search ${atlas.cohorts.length} cohorts…`} />
          <CommandList>
            <CommandEmpty>No cohort found.</CommandEmpty>
            {atlas.cohorts.length > 0
              ? Object.entries(groupByStudy(atlas)).map(([study, list]) => (
                  <CommandGroup key={study} heading={STUDY_LABEL[study] ?? study}>
                    {list.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={`${c.cohort} ${c.id} ${c.study}`}
                        onSelect={() => {
                          onCohortChange(c.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "size-4 shrink-0 text-brand",
                            c.id === cohort.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate font-mono text-[13px] text-foreground">
                          {prettyCohort(c)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))
              : null}
          </CommandList>
        </Command>

        {/* Pinned refinements — model + direction. Instant, palette stays open. */}
        <div className="space-y-label border-t border-border p-3">
          <div className="flex items-center justify-between gap-4">
            <span className="eyebrow">Model</span>
            <Segmented
              size="sm"
              aria-label="Background-rate model"
              value={bmr}
              onValueChange={onBmrChange}
              options={atlas.bmrs.map((b) => ({
                value: b,
                label: BMR_LABEL[b],
                disabled: !cohort.bmrs[b],
              }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="eyebrow">Show</span>
            <Segmented
              size="sm"
              aria-label="Show"
              value={dir}
              onValueChange={onDirChange}
              options={SHOW_OPTIONS}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Group cohorts by study, preserving first-seen study order (TCGA / MSK-IMPACT / MSK-CHORD). */
function groupByStudy(atlas: Atlas): Record<string, Atlas["cohorts"]> {
  const out: Record<string, Atlas["cohorts"]> = {};
  for (const c of atlas.cohorts) (out[c.study] ??= []).push(c);
  return out;
}
