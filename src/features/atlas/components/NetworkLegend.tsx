import { cn } from "@/lib/utils";

function EdgeLine({ color, dashed, label }: { color: string; dashed?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-label">
      <svg width="22" height="6" aria-hidden className="shrink-0">
        <line
          x1="0"
          y1="3"
          x2="22"
          y2="3"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={dashed ? "5 3" : undefined}
        />
      </svg>
      <span className="text-eyebrow text-muted-foreground-strong">{label}</span>
    </div>
  );
}

/**
 * The minimal, always-visible ME/CO legend (REDESIGN2 §1 invariant): line-style + hue carry the
 * encoding redundantly (survives deuteranopia and grayscale print). Trimmed to JUST the two edge
 * meanings — the size channels (node = P(mutated), edge width = |ρ|) and OncoKB-driver hue now live
 * in the "How to read this" escape hatch, so nothing methodological clutters the working surface.
 *
 * Layout is owned by the caller (NetworkView): a compact chip floated over the canvas on ≥640px,
 * or an inline row beneath the graph on mobile so it never occludes nodes on the short canvas.
 */
export function NetworkLegend({ floating = false }: { floating?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-caption",
        floating &&
          "pointer-events-none absolute bottom-3 left-3 rounded-lg border border-border bg-card/80 px-3 py-1.5 backdrop-blur-sm",
      )}
    >
      <EdgeLine color="var(--me-color)" label="Mutually exclusive" />
      <EdgeLine color="var(--co-color)" dashed label="Co-occurring" />
    </div>
  );
}
