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
import type { AtlasMode } from "@/features/atlas/types";
import { cn } from "@/lib/utils";

const MODES: { value: AtlasMode; label: string; detail: string }[] = [
  {
    value: "consensus",
    label: "Significant under all 3 backgrounds",
    detail: "Same direction and q < 0.01 across three distinct backgrounds.",
  },
  {
    value: "cbase",
    label: `Significant with ${BMR_LABEL.cbase}`,
    detail: "Primary background model.",
  },
  {
    value: "dig",
    label: `Significant with ${BMR_LABEL.dig}`,
    detail: "Per-gene background sensitivity view.",
  },
  {
    value: "mutsig",
    label: `Significant with ${BMR_LABEL.mutsig}`,
    detail: "Per-sample background sensitivity view where available.",
  },
];

export type SettingsDrawerProps = {
  open: boolean;
  mode: AtlasMode;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AtlasMode) => void;
};

export function SettingsDrawer({
  open,
  mode,
  onOpenChange,
  onModeChange,
}: SettingsDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open Atlas settings">
          <SlidersHorizontal className="size-4" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent variant="drawer">
        <DialogTitle>Result definition</DialogTitle>
        <DialogDescription className="mt-2">
          Choose which background model defines significance.
        </DialogDescription>

        <fieldset className="mt-7 space-y-2">
          <legend className="sr-only">Result definition</legend>
          {MODES.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer gap-3 border px-4 py-3.5 transition-colors",
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
                <span className="block text-sm font-black leading-5">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{option.detail}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}
