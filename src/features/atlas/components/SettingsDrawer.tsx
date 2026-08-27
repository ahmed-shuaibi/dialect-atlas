import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BMR_LABEL } from "@/features/atlas/lib/atlas-transform";
import { Q_THRESHOLDS, type AtlasMode, type QThreshold } from "@/features/atlas/types";
import { cn } from "@/lib/utils";

const MODES: { value: AtlasMode; label: string; detail: string }[] = [
  {
    value: "consensus",
    label: "All 3 backgrounds",
    detail: "Same pair and direction across CBaSE, DIG, and MutSigCV2.",
  },
  {
    value: "cbase",
    label: BMR_LABEL.cbase,
    detail: "Primary background.",
  },
  {
    value: "dig",
    label: BMR_LABEL.dig,
    detail: "Per-gene sensitivity view.",
  },
  {
    value: "mutsig",
    label: BMR_LABEL.mutsig,
    detail: "Per-sample sensitivity view.",
  },
];

export type SettingsDrawerProps = {
  open: boolean;
  mode: AtlasMode;
  qThreshold: QThreshold;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AtlasMode) => void;
  onQThresholdChange: (threshold: QThreshold) => void;
};

export function SettingsDrawer({
  open,
  mode,
  qThreshold,
  onOpenChange,
  onModeChange,
  onQThresholdChange,
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
        <DialogTitle>Customize</DialogTitle>
        <DialogDescription className="mt-2">Choose the background and q-value cutoff.</DialogDescription>

        <fieldset className="mt-8 space-y-2">
          <legend className="mb-3 text-sm font-semibold">Background</legend>
          {MODES.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-2xl border px-4 py-3.5 transition-colors",
                mode === option.value
                  ? "border-ink bg-sand"
                  : "border-line bg-paper hover:border-ink/30",
              )}
            >
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
                <span className="mt-1 block text-sm leading-5 text-muted">{option.detail}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="mt-8">
          <legend className="text-sm font-semibold">q-value cutoff</legend>
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
          <p className="mt-3 text-sm leading-6 text-muted">
            Reclassifies published q-values; it does not rerun FDR. MEGSA keeps p &lt; 0.001.
          </p>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}
