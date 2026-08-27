import { Check, ExternalLink, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ATLAS_MODES } from "@/features/atlas/lib/atlas-metadata";
import {
  BMR_COUNT_THRESHOLDS,
  Q_THRESHOLDS,
  type AtlasMode,
  type BmrCount,
  type QThreshold,
} from "@/features/atlas/types";
import { cn } from "@/lib/utils";

type BmrCountOption = `${BmrCount}`;
const BMR_COUNT_OPTIONS = BMR_COUNT_THRESHOLDS.map((count) => {
  const value = String(count) as BmrCountOption;
  return { value, label: value };
});

function BmrMinimumControl({
  label,
  ariaLabel,
  value,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  value: BmrCount;
  onChange: (value: BmrCount) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[18px] border border-line bg-paper px-4 py-3",
        "sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <span className="text-[15px] font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <SegmentedControl
          value={String(value) as BmrCountOption}
          options={BMR_COUNT_OPTIONS}
          onChange={(next) => onChange(Number(next) as BmrCount)}
          label={ariaLabel}
          className="shadow-none"
        />
        <span className="font-mono text-xs text-muted">of 3</span>
      </div>
    </div>
  );
}

export type SettingsDrawerProps = {
  open: boolean;
  showBackground?: boolean;
  showConsensusThresholds?: boolean;
  mode: AtlasMode;
  qThreshold: QThreshold;
  minIdentifiedBmrs: BmrCount;
  minSignificantBmrs: BmrCount;
  highlightLikelyPassengers: boolean;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AtlasMode) => void;
  onQThresholdChange: (threshold: QThreshold) => void;
  onMinIdentifiedBmrsChange: (minimum: BmrCount) => void;
  onMinSignificantBmrsChange: (minimum: BmrCount) => void;
  onHighlightLikelyPassengersChange: (highlight: boolean) => void;
};

export function SettingsDrawer({
  open,
  showBackground = true,
  showConsensusThresholds = false,
  mode,
  qThreshold,
  minIdentifiedBmrs,
  minSignificantBmrs,
  highlightLikelyPassengers,
  onOpenChange,
  onModeChange,
  onQThresholdChange,
  onMinIdentifiedBmrsChange,
  onMinSignificantBmrsChange,
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

        {showConsensusThresholds && (
          <fieldset className="mt-7">
            <legend className="text-sm font-semibold">Consensus thresholds</legend>
            <div className="mt-3 space-y-2">
              <BmrMinimumControl
                label="BMRs identifying"
                ariaLabel="Minimum BMRs identifying this interaction"
                value={minIdentifiedBmrs}
                onChange={onMinIdentifiedBmrsChange}
              />
              <BmrMinimumControl
                label="BMRs significant"
                ariaLabel="Minimum BMRs significant at the q cutoff"
                value={minSignificantBmrs}
                onChange={onMinSignificantBmrsChange}
              />
            </div>
          </fieldset>
        )}

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
