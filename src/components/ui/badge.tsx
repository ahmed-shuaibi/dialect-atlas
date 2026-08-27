import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Direction } from "@/features/atlas/types";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function DirectionBadge({ direction }: { direction: Direction }) {
  return (
    <Badge className={direction === "ME" ? "border-me/25 bg-me-soft text-me" : "border-co/25 bg-co-soft text-co"}>
      <span className={cn("size-1.5 rounded-full", direction === "ME" ? "bg-me" : "bg-co")} />
      {direction}
    </Badge>
  );
}
