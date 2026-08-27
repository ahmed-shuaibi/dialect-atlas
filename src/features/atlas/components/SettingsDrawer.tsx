import { Check, ExternalLink, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ATLAS_MODES } from "@/features/atlas/lib/atlas-metadata";
import { Q_THRESHOLDS, type AtlasMode, type QThreshold } from "@/features/atlas/types";
import { cn } from "@/lib/utils";

export type SettingsDrawerProps = {
  open: boolean;
  showBackground?: boolean;
  mode: AtlasMode;
  qThreshold: QThreshold;
  highlightLikelyPassengers: boolean;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AtlasMode) => void;
  onQThresholdChange: (threshold: QThreshold) => void;
  onHighlightLikelyPassengersChange: (highlight: boolean) => void;
};

export function SettingsDrawer({
  open,
  showBackground = true,
  mode,
  qThreshold,
  highlightLikelyPassengers,
  onOpenChange,
  onModeChange,
  onQThresholdChange,
  onHighlightLikelyPassengersChange,
}: SettingsDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Customize Atlas results">
          <SlidersHorizontal className="size-4" aria-hidden />
          <span className="hidden sm:inline">Customize</span>
        </Button>
      </DialogTrigger>
      <DialogContent variant="drawer">
        <DialogTitle className="pr-12">Customize</DialogTitle>

        {showBackground && (
          <fieldset className="mt-7 space-y-2">
            <legend className="mb-3 text-sm font-semibold">Background</legend>
            {ATLAS_MODES.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center gap-2 rounded-[18px] border px-4 py-3 transition-colors",
                  mode === option.value
                    ? "border-ink bg-sand"
                    : "border-line bg-paper hover:border-ink/30",
                )}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="radio"
                    name="atlas-mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => onModeChange(option.value)}
                    className="mt-0.5 size-4 shrink-0 accent-ink"
                  />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold leading-5">{option.label}</span>
                    <span className="mt-0.5 block text-sm leading-5 text-muted">{option.detail}</span>
                  </span>
                </label>
                {option.href && (
                  <a
                    href={option.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Read the ${option.label} method`}
                    className="focus-ring grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink"
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
              </div>
            ))}
          </fieldset>
        )}

        <fieldset className={showBackground ? "mt-7" : "mt-6"}>
          <legend className="text-sm font-semibold">q cutoff</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Q_THRESHOLDS.map((threshold) => (
              <button
                key={threshold}
                type="button"
                aria-pressed={qThreshold === threshold}
                onClick={() => onQThresholdChange(threshold)}
                className={cn(
                  "focus-ring h-11 rounded-full border border-line bg-paper font-mono text-sm font-medium text-muted transition-colors hover:border-ink/30 hover:text-ink",
                  qThreshold === threshold && "border-ink bg-ink text-paper hover:bg-ink hover:text-paper",
                )}
              >
                {threshold}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-sm font-semibold">Annotations</legend>
          <button
            type="button"
            aria-pressed={highlightLikelyPassengers}
            onClick={() => onHighlightLikelyPassengersChange(!highlightLikelyPassengers)}
            className={cn(
              "focus-ring mt-3 flex w-full items-start gap-3 rounded-[18px] border border-line bg-paper px-4 py-3.5 text-left transition-colors hover:border-ink/30",
              highlightLikelyPassengers && "border-passenger/40 bg-passenger-soft",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-line",
                highlightLikelyPassengers && "border-passenger bg-passenger text-paper",
              )}
            >
              {highlightLikelyPassengers && <Check className="size-3" aria-hidden />}
            </span>
            <span>
              <span className="block text-[15px] font-semibold">Highlight likely passengers</span>
              <span className="mt-1 block text-sm leading-5 text-muted">
                Cohort-specific recurrent gene effects outside OncoKB.
              </span>
            </span>
          </button>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}
