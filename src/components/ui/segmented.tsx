import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Segmented — a shared, single-select control for 2–5 mutually-exclusive options.
 *
 * One home for the "segmented row" role in the Atlas: hosts Model (CBaSE / Dig /
 * MutSigCV2) and Show (Both / ME / CO) inside the ⌘K command popover, replacing the
 * two bespoke `Select`s. Options may carry a small leading `icon` glyph, so the Show
 * variant can render the ME-blue / CO-amber swatches and double as the legend.
 *
 * Interaction: `role="radiogroup"` with roving tabindex — Tab lands on the selected
 * segment; Arrow keys / Home / End move (and select) between segments; the group takes
 * one tab stop. Selection is marked by a STATIC border + inset highlight (no sliding
 * layoutId motion), tokens only, no drop shadows.
 *
 * @example
 * <Segmented
 *   aria-label="Model"
 *   value={model}
 *   onValueChange={setModel}
 *   options={[
 *     { value: "cbase", label: "CBaSE" },
 *     { value: "dig", label: "Dig" },
 *     { value: "mutsigcv2", label: "MutSigCV2" },
 *   ]}
 * />
 *
 * @example  // Show variant — leading swatch doubles as the ME/CO legend
 * <Segmented
 *   aria-label="Show"
 *   value={dir}
 *   onValueChange={setDir}
 *   options={[
 *     { value: "both", label: "Both" },
 *     { value: "me", label: "ME", icon: <EdgeSwatch type="ME" /> },
 *     { value: "co", label: "CO", icon: <EdgeSwatch type="CO" /> },
 *   ]}
 * />
 */

const segmentedItemVariants = cva(
  // Static selected border via `aria-checked` — no motion, elevation = border + inset.
  "focus-ring inline-flex cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--radius)-3px)] border font-medium outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 aria-checked:border-border aria-checked:bg-white/[0.06] aria-checked:text-foreground aria-checked:shadow-[var(--elev-highlight)] [&:not([aria-checked=true])]:border-transparent [&:not([aria-checked=true])]:text-muted-foreground-strong [&:not([aria-checked=true])]:hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "h-7 px-2.5 text-sm",
        sm: "h-6 px-2 text-[13px]",
      },
    },
    defaultVariants: { size: "default" },
  },
);

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Optional leading glyph, e.g. an ME/CO `EdgeSwatch` so the control is also the legend. */
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string>
  extends VariantProps<typeof segmentedItemVariants> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** Accessible name for the radiogroup (label the control it stands in for). */
  "aria-label"?: string;
  /** Layout-only classes for the track. */
  className?: string;
}

export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  size,
  className,
  "aria-label": ariaLabel,
}: SegmentedProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const focusIndex = (i: number) => {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    refs.current[i]?.focus();
    onValueChange(opt.value);
  };

  // Step to the next/previous ENABLED option, wrapping around.
  const step = (from: number, dir: 1 | -1) => {
    const n = options.length;
    for (let k = 1; k <= n; k++) {
      const i = (from + dir * k + n * k) % n;
      if (!options[i]?.disabled) return i;
    }
    return from;
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        // stopPropagation so ancestor / document-level ←/→ handlers (e.g. App's cohort
        // stepper) can't ALSO act on the same key while a segment is focused.
        e.preventDefault();
        e.stopPropagation();
        focusIndex(step(i, 1));
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        e.stopPropagation();
        focusIndex(step(i, -1));
        break;
      case "Home":
        e.preventDefault();
        e.stopPropagation();
        focusIndex(options[0]?.disabled ? step(0, 1) : 0);
        break;
      case "End": {
        e.preventDefault();
        e.stopPropagation();
        const last = options.length - 1;
        focusIndex(options[last]?.disabled ? step(last, -1) : last);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-white/[0.02] p-0.5",
        className,
      )}
    >
      {options.map((opt, i) => {
        const checked = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={opt.disabled}
            // Roving tabindex: only the selected segment is in the tab order.
            tabIndex={checked ? 0 : -1}
            onClick={() => onValueChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={segmentedItemVariants({ size })}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export { segmentedItemVariants };
