import { Check, Circle, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type EvidenceState = "supported" | "unsupported" | "warning" | "missing";

export function EvidenceStatus({
  state,
  label,
  className,
}: {
  state: EvidenceState;
  label: string;
  className?: string;
}) {
  const Icon = state === "supported" ? Check : state === "warning" ? TriangleAlert : Circle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold",
        state === "supported" && "text-support",
        state === "warning" && "text-alert",
        (state === "unsupported" || state === "missing") && "text-muted",
        className,
      )}
      aria-label={label}
      title={label}
    >
      {state === "missing" ? <span aria-hidden>—</span> : <Icon className="size-4" strokeWidth={2.4} aria-hidden />}
    </span>
  );
}
