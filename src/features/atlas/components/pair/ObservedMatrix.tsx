import { fmtInt } from "@/features/atlas/lib/atlas-transform";
import type { DialectRow, InteractionResult } from "@/features/atlas/types";
import { cn } from "@/lib/utils";

export function ObservedMatrix({
  row,
  result,
}: {
  row: DialectRow;
  result: InteractionResult;
}) {
  const cells = [
    { label: `${result.ga} mutated, ${result.gb} mutated`, value: row.observedBoth, both: true },
    { label: `${result.ga} mutated, ${result.gb} not mutated`, value: row.observedAOnly, both: false },
    { label: `${result.ga} not mutated, ${result.gb} mutated`, value: row.observedBOnly, both: false },
    { label: `${result.ga} not mutated, ${result.gb} not mutated`, value: row.observedNeither, both: false },
  ];
  const cell = ({ label, value, both }: (typeof cells)[number]) => (
    <div
      key={label}
      className={cn(
        "grid min-h-20 place-items-center rounded-2xl border bg-paper px-3 py-4 font-mono text-lg font-semibold tabular-nums sm:min-h-24",
        both ? "border-ink bg-sand" : "border-line",
      )}
      aria-label={`${label}: ${fmtInt(value)} tumors`}
    >
      {fmtInt(value)}
    </div>
  );

  return (
    <div className="grid grid-cols-[auto_repeat(2,minmax(0,1fr))] items-stretch gap-2 text-xs">
      <span />
      <span className="self-end px-1 pb-1 text-center font-bold leading-tight">{result.gb} +</span>
      <span className="self-end px-1 pb-1 text-center font-bold leading-tight">{result.gb} −</span>
      <span className="flex items-center pr-2 text-right font-bold leading-tight">{result.ga} +</span>
      {cells.slice(0, 2).map(cell)}
      <span className="flex items-center pr-2 text-right font-bold leading-tight">{result.ga} −</span>
      {cells.slice(2).map(cell)}
    </div>
  );
}
