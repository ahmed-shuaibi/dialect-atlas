import { X } from "lucide-react";
import { BMR_LABEL } from "@/features/atlas/lib/atlas-transform";
import { VIEW_DEFAULTS } from "@/features/atlas/hooks/useAtlasView";
import type { Bmr, DirFilter } from "@/features/atlas/types";

/** Human label for a non-default direction filter (the default, ME-only, never shows a chip). */
const DIR_LABEL: Record<DirFilter, string> = {
  both: "ME + CO",
  ME: "ME only",
  CO: "CO only",
};

export interface ActiveChipsProps {
  bmr: Bmr;
  dir: DirFilter;
  /** Reset the model facet back to its default. */
  onResetBmr: () => void;
  /** Reset the direction facet back to its default. */
  onResetDir: () => void;
}

/**
 * ActiveChips — removable mono chips echoing only NON-DEFAULT state (REDESIGN2 §2). With the model
 * and direction controls tucked inside the ⌘K palette, these chips keep the current refinements
 * legible on the surface without permanent dropdowns; dismissing a chip resets that facet to its
 * default. Renders nothing when everything is at its default.
 */
export function ActiveChips({ bmr, dir, onResetBmr, onResetDir }: ActiveChipsProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (bmr !== VIEW_DEFAULTS.b) {
    chips.push({ key: "bmr", label: BMR_LABEL[bmr], onRemove: onResetBmr });
  }
  if (dir !== VIEW_DEFAULTS.d) {
    chips.push({ key: "dir", label: DIR_LABEL[dir], onRemove: onResetDir });
  }
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-intra">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onRemove}
          aria-label={`Reset ${c.label}`}
          className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-border bg-white/[0.04] py-1 pl-2.5 pr-2 font-mono text-eyebrow text-muted-foreground-strong transition-colors hover:bg-white/[0.07] hover:text-foreground"
        >
          {c.label}
          <X className="size-3" aria-hidden />
        </button>
      ))}
    </div>
  );
}
