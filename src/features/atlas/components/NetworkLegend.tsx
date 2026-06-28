import { cn } from "@/lib/utils";

function EdgeLine({ color, dashed, label }: { color: string; dashed?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-label">
      <svg width="26" height="6" aria-hidden className="shrink-0">
        <line
          x1="0"
          y1="3"
          x2="26"
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
 * Documents every visual encoding, redundantly (line style + hue carry ME/CO so the meaning
 * survives deuteranopia and a grayscale print), plus the two size channels: edge width = |ρ|,
 * node size = the gene's marginal mutation probability.
 *
 * Layout is owned by the caller (NetworkView): floated over the canvas on >=640px, rendered as a
 * static row beneath the graph on mobile so it never occludes nodes on the short canvas. On the
 * floating variant the size/membership rows collapse to keep the overlay small.
 */
export function NetworkLegend({ floating = false }: { floating?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-label",
        floating &&
          "pointer-events-none absolute bottom-3 left-3 rounded-lg border border-border bg-card/80 px-3 py-2 backdrop-blur-sm",
      )}
    >
      <EdgeLine color="var(--me-color)" label="Mutually exclusive (solid)" />
      <EdgeLine color="var(--co-color)" dashed label="Co-occurring (dashed)" />
      {/* Size/membership channels: hidden in the small floating overlay, shown in the static row. */}
      <div className={cn(floating && "hidden")}>
        <div className="my-intra h-px w-full bg-border" />
        <div className="flex flex-col gap-label">
          <div className="flex items-center gap-label">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: "#8ab2c0", border: "1px solid #2b3640" }}
              aria-hidden
            />
            <span className="text-eyebrow text-muted-foreground-strong">OncoKB driver</span>
          </div>
          <div className="flex items-center gap-label text-eyebrow text-muted-foreground-strong">
            <span className="font-mono tabular-nums">|ρ|</span>
            <span className="text-muted-foreground-strong">= edge width</span>
          </div>
          <div className="flex items-center gap-label text-eyebrow text-muted-foreground-strong">
            <span className="font-mono">P(mutated)</span>
            <span className="text-muted-foreground-strong">= node size</span>
          </div>
        </div>
      </div>
    </div>
  );
}
