function LegendLine({ color, dashed, label }: { color: string; dashed?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="6" aria-hidden>
        <line
          x1="0"
          y1="3"
          x2="24"
          y2="3"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={dashed ? "5 3" : undefined}
        />
      </svg>
      <span className="text-[11px] text-muted-foreground-strong">{label}</span>
    </div>
  );
}

export function NetworkLegend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-lg border border-border bg-card/80 px-3 py-2.5 backdrop-blur-sm">
      <LegendLine color="var(--me-color)" label="Mutually exclusive" />
      <LegendLine color="var(--co-color)" dashed label="Co-occurring" />
      <div className="flex items-center gap-2">
        <span
          className="inline-block size-2.5 rounded-full"
          style={{ background: "#8ab2c0", border: "1px solid #2b3640" }}
        />
        <span className="text-[11px] text-muted-foreground-strong">OncoKB driver</span>
      </div>
    </div>
  );
}
