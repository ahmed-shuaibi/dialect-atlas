import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { resultEffectText } from "@/features/atlas/components/explore-display";
import { SignificanceMark } from "@/features/atlas/components/SignificanceMark";
import { modelAgreement, resultQ } from "@/features/atlas/lib/atlas-transform";
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
  onSelect,
}: {
  direction: Direction;
  results: InteractionResult[];
  mode: AtlasMode;
  onSelect: (result: InteractionResult) => void;
}) {
  const copy = DIRECTION_COPY[direction];
  const [visible, setVisible] = useState(LIST_PAGE_SIZE);
  useEffect(() => setVisible(LIST_PAGE_SIZE), [results]);
  const shown = results.slice(0, visible);
  return (
    <section aria-labelledby={`${direction}-heading`} className="min-w-0">
      <header className="mb-3 flex items-end justify-between gap-4 border-b-2 border-ink pb-3">
        <div>
          <h2
            id={`${direction}-heading`}
            className="text-xl font-bold leading-tight tracking-[-0.025em] sm:text-2xl"
          >
            {copy.title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">{copy.detail}</p>
        </div>
        <p className="shrink-0 font-mono text-xs text-muted">
          {results.length} {results.length === 1 ? "pair" : "pairs"}
        </p>
      </header>

      {results.length === 0 ? (
        <p className="border-b border-line py-10 text-sm text-muted">
          No significant {direction} interactions.
        </p>
      ) : (
        <ol>
          {shown.map((result, index) => {
            const agreement = modelAgreement(result);
            return (
              <li key={result.id} className="border-b border-line" data-result-id={result.id}>
                <button
                  type="button"
                  onClick={() => onSelect(result)}
                  className="focus-ring group grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-4 text-left transition-colors hover:bg-paper/70 sm:grid-cols-[2rem_minmax(0,1fr)_auto_auto_auto] sm:px-2"
                >
                  <span className="row-span-2 font-mono text-[11px] text-muted sm:row-span-1">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 font-mono text-sm font-semibold tracking-[-0.02em]">
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
                  <span className="hidden font-mono text-xs font-medium sm:block">
                    {resultEffectText(result, mode)}
                  </span>
                  <SignificanceMark q={resultQ(result, mode)} />
                  <span className="hidden whitespace-nowrap text-[11px] font-semibold text-muted sm:block">
                    {agreement}/3 models
                  </span>
                  <ArrowUpRight
                    className="size-4 text-muted transition-colors group-hover:text-ink sm:hidden"
                    aria-hidden
                  />
                  <span className="col-start-2 flex items-center gap-3 text-[11px] font-semibold sm:hidden">
                    <span className="font-mono">{resultEffectText(result, mode)}</span>
                    <span className="text-muted">{agreement}/3 models</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {visible < results.length && (
        <button
          type="button"
          onClick={() => setVisible((value) => Math.min(value + LIST_PAGE_SIZE, results.length))}
          className="focus-ring mt-3 w-full border border-line bg-paper px-4 py-3 text-xs font-bold text-muted hover:border-ink/30 hover:text-ink"
        >
          Show {Math.min(LIST_PAGE_SIZE, results.length - visible)} more
        </button>
      )}
    </section>
  );
}
