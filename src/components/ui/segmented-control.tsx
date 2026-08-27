import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function SegmentedControl({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      className={cn("inline-flex items-center gap-1 rounded-full border border-line bg-paper p-1 shadow-sm", className)}
      {...props}
    />
  );
}

export function SegmentedControlButton({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "focus-ring inline-flex h-8 items-center justify-center gap-2 rounded-full px-3.5 text-sm font-semibold text-muted transition-colors hover:bg-sand hover:text-ink",
        active && "bg-ink text-paper hover:bg-ink hover:text-paper",
        className,
      )}
      {...props}
    />
  );
}
