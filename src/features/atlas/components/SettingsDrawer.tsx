import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BMR_LABEL } from "@/features/atlas/lib/atlas-transform";
import type { AtlasMode } from "@/features/atlas/types";
import { cn } from "@/lib/utils";

const MODES: { value: AtlasMode; label: string; detail: string }[] = [
  {
    value: "consensus",
    label: "All-three-BMR consensus",
    detail: "Same pair and direction across all three background models; MutSig fallback features are excluded.",
  },
  {
    value: "cbase",
    label: BMR_LABEL.cbase,
    detail: "Primary DIALECT background model.",
  },
  {
    value: "dig",
    label: BMR_LABEL.dig,
    detail: "Per-gene background robustness analysis.",
  },
  {
    value: "mutsig",
    label: BMR_LABEL.mutsig,
    detail: "Per-sample robustness where available; CBaSE fallbacks are flagged in pair detail.",
  },
];

export function SettingsDrawer({
  open,
  mode,
  strict,
  onOpenChange,
  onModeChange,
  onStrictChange,
}: {
  open: boolean;
  mode: AtlasMode;
  strict: boolean;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AtlasMode) => void;
  onStrictChange: (strict: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open Atlas settings">
          <SlidersHorizontal className="size-4" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent variant="drawer">
        <DialogTitle>View settings</DialogTitle>
        <DialogDescription className="mt-2">
          Consensus is the default. Individual BMR models remain available for sensitivity checks.
        </DialogDescription>

        <fieldset className="mt-8 space-y-2">
          <legend className="eyebrow mb-3">Interaction set</legend>
          {MODES.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                mode === option.value ? "border-ink bg-sand" : "border-line hover:bg-sand/60",
              )}
            >
              <input
                type="radio"
                name="atlas-mode"
                value={option.value}
                checked={mode === option.value}
                onChange={() => onModeChange(option.value)}
                className="mt-1 size-4 accent-ink"
              />
              <span>
                <span className="block text-sm font-bold">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{option.detail}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="mt-8 border-t border-line pt-6">
          <label className="flex cursor-pointer items-start justify-between gap-5">
            <span>
              <span className="block text-sm font-bold">Strict FDR support</span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                Require q &lt; 0.01 for the exact pair in all three BMR models.
              </span>
            </span>
            <input
              type="checkbox"
              checked={strict}
              onChange={(event) => onStrictChange(event.target.checked)}
              className="mt-1 size-5 shrink-0 accent-ink"
            />
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
