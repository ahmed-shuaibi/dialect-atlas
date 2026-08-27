import { Check } from "lucide-react";
import { fmtQ } from "@/features/atlas/lib/atlas-transform";

export function SignificanceMark({ q }: { q: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-support"
      aria-label={`Significant at q ${fmtQ(q)}`}
    >
      <span className="flex size-4 items-center justify-center border border-support/45" aria-hidden>
        <Check className="size-3" strokeWidth={2.5} />
      </span>
      <span>Significant</span>
      <span className="font-mono text-[11px] font-medium text-muted">q {fmtQ(q)}</span>
    </span>
  );
}
