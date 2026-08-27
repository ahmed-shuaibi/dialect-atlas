import { ArrowUpRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { resultEffectText } from "@/features/atlas/components/explore-display";
import { fmtQ, modelAgreement, resultIsSignificant, resultQ } from "@/features/atlas/lib/atlas-transform";
import type { AtlasMode, Direction, InteractionResult } from "@/features/atlas/types";
import { cn } from "@/lib/utils";

const DIRECTION_COPY: Record<Direction, { title: string; detail: string }> = {
  ME: {
    title: "Mutually exclusive",
    detail: "Found together less often than expected.",
  },
  CO: {
    title: "Co-occurring",
    detail: "Found together more often than expected.",
  },
};

const LIST_PAGE_SIZE = 60;

export function InteractionLane({
  direction,
  results,
  mode,
  qThreshold,
  onSelect,
}: {
  direction: Direction;
  results: InteractionResult[];
  mode: AtlasMode;
  qThreshold: number;
  onSelect: (result: InteractionResult) => void;
}) {
  const copy = DIRECTION_COPY[direction];
  const [visible, setVisible] = useState(LIST_PAGE_SIZE);
  useEffect(() => setVisible(LIST_PAGE_SIZE), [results]);
  const shown = results.slice(0, visible);
  return (
    <section aria-labelledby={`${direction}-heading`} className="surface-card min-w-0 overflow-hidden">
      <header className="flex items-end justify-between gap-4 border-b border-line px-5 py-5">
        <div>
          <h2
            id={`${direction}-heading`}
            className="text-xl font-semibold leading-tight sm:text-2xl"
          >
            {copy.title}
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted">{copy.detail}</p>
        </div>
        <p className="shrink-0 font-mono text-sm text-muted">
          {results.length} {results.length === 1 ? "pair" : "pairs"}
        </p>
      </header>

      {results.length === 0 ? (
        <p className="px-5 py-12 text-base text-muted">
          No {direction} pairs in this view.
        </p>
      ) : (
        <ol className="space-y-1 p-2">
          {shown.map((result) => {
            const agreement = modelAgreement(result, qThreshold);
            const significant = resultIsSignificant(result, mode, qThreshold);
            const q = resultQ(result, mode);
            return (
              <li key={result.id} data-result-id={result.id}>
                <button
                  type="button"
                  onClick={() => onSelect(result)}
                  className={cn(
                    "focus-ring group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-sand sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]",
                    significant && "bg-support-soft/60",
                  )}
                >
                  <span className="min-w-0 font-mono text-[15px] font-semibold tracking-[-0.015em]">
                    <span className="break-words">{result.ga}</span>
                    <span
                      aria-hidden
                      className={cn(
                        "mx-2 inline-block w-5 align-middle border-t-2",
                        direction === "ME" ? "border-solid border-me" : "border-dashed border-co",
                      )}
                    />
                    <span className="break-words">{result.gb}</span>
                  </span>
                  <span className="hidden font-mono text-[13px] font-medium sm:block">
                    {resultEffectText(result, mode)}
                  </span>
                  <span className="hidden whitespace-nowrap font-mono text-[13px] text-muted sm:block">
                    {mode === "consensus" ? "max " : ""}q {fmtQ(q)}
                  </span>
                  <span className="flex items-center justify-end gap-2 text-sm font-semibold text-muted">
                    {significant && (
                      <span className="grid size-6 place-items-center rounded-full bg-support text-paper" aria-label={`Significant at q ${fmtQ(q)}`}>
                        <Check className="size-3.5" strokeWidth={2.6} aria-hidden />
                      </span>
                    )}
                    <ArrowUpRight className="size-4 transition-colors group-hover:text-ink" aria-hidden />
                  </span>
                  <span className="col-start-1 flex items-center gap-3 text-[13px] font-semibold sm:hidden">
                    <span className="font-mono">{resultEffectText(result, mode)}</span>
                    <span className="font-mono text-muted">{mode === "consensus" ? "max " : ""}q {fmtQ(q)}</span>
                    <span className="text-muted">{agreement}/3 significant</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {visible < results.length && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setVisible((value) => Math.min(value + LIST_PAGE_SIZE, results.length))}
          className="m-3 w-[calc(100%-1.5rem)]"
        >
          Show {Math.min(LIST_PAGE_SIZE, results.length - visible)} more
        </Button>
      )}
    </section>
  );
}
