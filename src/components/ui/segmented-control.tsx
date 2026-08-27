import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const style = {
    "--segment-count": options.length,
    "--segment-index": activeIndex,
  } as CSSProperties;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? options.length - 1
        : (activeIndex + (event.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    const next = options[nextIndex];
    if (!next) return;
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]',
    );
    buttons[nextIndex]?.focus();
    onChange(next.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "segmented-control relative inline-grid min-w-fit rounded-full border border-line bg-paper p-1 shadow-sm",
        className,
      )}
      style={style}
    >
      <span className="segmented-control-indicator" aria-hidden />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-ring relative z-10 inline-flex h-8 items-center justify-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors duration-200",
              active ? "text-paper" : "text-muted hover:text-ink",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
