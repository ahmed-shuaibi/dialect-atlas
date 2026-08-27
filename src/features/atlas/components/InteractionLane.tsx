import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { DirectionBadge } from "@/components/ui/badge";
import { fmtStat, lrtEvidence } from "@/features/atlas/lib/atlas-transform";
import type { AtlasMode, Direction, InteractionResult } from "@/features/atlas/types";
import { cn } from "@/lib/utils";

const DISPLAY_LIMIT = 12;

function median(values: number[]): number {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)] ?? 0;
}

function metric(result: InteractionResult, mode: AtlasMode): number {
  if (mode !== "consensus") {
    return result.direction === "ME" ? Math.abs(result.representative.rho) : lrtEvidence(result.representative);
  }
  return median(
    result.matches.map((match) =>
      result.direction === "ME" ? Math.abs(match.row.rho) : lrtEvidence(match.row),
    ),
  );
}

function metricText(result: InteractionResult, mode: AtlasMode): string {
  const value = metric(result, mode);
  const prefix = mode === "consensus" ? "median " : "";
  return result.direction === "ME"
    ? `${prefix}ρ −${fmtStat(value)}`
    : `${prefix}LRT ${fmtStat(value, 2)}`;
}

function ResultBar({
  result,
  max,
  mode,
}: {
  result: InteractionResult;
  max: number;
  mode: AtlasMode;
}) {
  const width = max > 0 ? Math.max(4, (metric(result, mode) / max) * 100) : 4;
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]" aria-hidden>
      <div
        className={cn("h-full rounded-full", result.direction === "ME" ? "bg-me" : "bg-co")}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function InteractionLane({
  direction,
  results,
  mode,
  onSelect,
}: {
  direction: Direction;
  results: InteractionResult[];
  mode: AtlasMode;
  onSelect: (result: InteractionResult) => void;
}) {
  const [visible, setVisible] = useState(DISPLAY_LIMIT);
  const resultSetKey = `${mode}:${direction}:${results.length}:${results[0]?.id ?? "empty"}`;
  useEffect(() => setVisible(DISPLAY_LIMIT), [resultSetKey]);
  const shown = results.slice(0, visible);
  const top = shown[0];
  const max = Math.max(0, ...shown.map((result) => metric(result, mode)));
  const me = direction === "ME";

  return (
    <section aria-labelledby={`${direction}-heading`} className="min-w-0">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <DirectionBadge direction={direction} />
          <h2 id={`${direction}-heading`} className="mt-3 text-[clamp(1.7rem,3vw,2.65rem)] font-black leading-none tracking-[-0.045em]">
            {me ? "Mutually exclusive" : "Co-occurring"}
          </h2>
        </div>
        <p className="shrink-0 text-xs font-semibold text-muted">{results.length} pairs</p>
      </div>

      {!top ? (
        <div className="rounded-[2rem] border border-dashed border-line bg-paper/50 px-6 py-16 text-center">
          <p className="font-bold">No {direction} pairs in this view.</p>
          <p className="mt-2 text-sm text-muted">Try another model or turn off strict FDR support.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onSelect(top)}
            className={cn(
              "focus-ring group w-full rounded-[2rem] border bg-paper p-6 text-left shadow-soft transition-transform hover:-translate-y-0.5 sm:p-8",
              me ? "border-me/20" : "border-co/20",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow">Top-ranked interaction</span>
              <ArrowUpRight className="size-5 text-muted transition-colors group-hover:text-ink" aria-hidden />
            </div>
            <div className="my-9 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
              <span className="break-all text-right font-mono text-[clamp(1.3rem,3vw,2.25rem)] font-semibold tracking-[-0.04em]">
                {top.ga}
              </span>
              <span
                aria-hidden
                className={cn(
                  "block w-10 border-t-2 sm:w-16",
                  me ? "border-solid border-me" : "border-dashed border-co",
                )}
              />
              <span className="break-all font-mono text-[clamp(1.3rem,3vw,2.25rem)] font-semibold tracking-[-0.04em]">
                {top.gb}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
              <span className={me ? "text-me" : "text-co"}>{metricText(top, mode)}</span>
              <span className="text-muted">
                FDR support {top.fdrSupport}/3
                {top.mutsigFallbackFeatures.length > 0 && (
                  <span className="ml-2 text-alert">· MutSig → CBaSE fallback</span>
                )}
              </span>
            </div>
            <ResultBar result={top} max={max} mode={mode} />
          </button>

          <ol className="overflow-hidden rounded-[2rem] border border-line bg-paper shadow-soft">
            {shown.slice(1).map((result, index) => (
              <li key={result.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelect(result)}
                  className="focus-ring group grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-sand/60 sm:px-5"
                >
                  <span className="font-mono text-xs text-muted">{String(index + 2).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-sm font-semibold">
                      {result.ga} <span className="text-muted">/</span> {result.gb}
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold text-muted">
                      FDR support {result.fdrSupport}/3
                      {result.mutsigFallbackFeatures.length > 0 && (
                        <span className="ml-2 text-alert">· MutSig → CBaSE fallback</span>
                      )}
                    </span>
                    <ResultBar result={result} max={max} mode={mode} />
                  </span>
                  <span className={cn("text-right font-mono text-xs font-semibold", me ? "text-me" : "text-co")}>
                    {metricText(result, mode)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {(results.length > DISPLAY_LIMIT || visible > DISPLAY_LIMIT) && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {visible > DISPLAY_LIMIT && (
                <button
                  type="button"
                  onClick={() => setVisible(DISPLAY_LIMIT)}
                  className="focus-ring rounded-full px-4 py-2 text-xs font-bold text-muted hover:bg-ink/[0.05] hover:text-ink"
                >
                  Show fewer
                </button>
              )}
              {visible < results.length && (
                <button
                  type="button"
                  onClick={() => setVisible((value) => Math.min(results.length, value + DISPLAY_LIMIT))}
                  className="focus-ring rounded-full px-4 py-2 text-xs font-bold text-muted hover:bg-ink/[0.05] hover:text-ink"
                >
                  Show {Math.min(DISPLAY_LIMIT, results.length - visible)} more
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
