import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Reusable info-glyph + shadcn Tooltip. Used by table stat headers and the cohort meta strip.
 * The trigger is a real keyboard-focusable <button> (so the definition is reachable without a
 * mouse) with a 24px hit area (WCAG 2.5.8) around the small glyph. Click toggles the tip open so
 * it is also operable on touch, where there is no hover. `label` is the accessible name;
 * `children` is the tooltip body.
 */
export function InfoTip({
  label,
  children,
  className,
  side = "top",
}: {
  /** Accessible name for the trigger, e.g. "About ρ". */
  label: string;
  /** Tooltip body (plain-language definition). */
  children: ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "focus-ring -m-1 inline-flex size-6 items-center justify-center rounded-md p-1 text-muted-foreground-strong transition-colors hover:text-foreground",
            className,
          )}
        >
          <Info className="size-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side}>{children}</TooltipContent>
    </Tooltip>
  );
}
