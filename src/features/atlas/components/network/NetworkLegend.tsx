import { Move } from "lucide-react";

export function NetworkLegend({
  meCount,
  coCount,
  totalResults,
  shownResults,
  showLikelyPassengers,
}: {
  meCount: number;
  coCount: number;
  totalResults: number;
  shownResults: number;
  showLikelyPassengers: boolean;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-muted">
      <span className="inline-flex items-center gap-2">
        <span className="w-6 border-t-2 border-me" aria-hidden />ME
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="w-6 border-t-2 border-dashed border-co" aria-hidden />CO
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Move className="size-4" aria-hidden />Drag nodes
      </span>
      {showLikelyPassengers && (
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-passenger" aria-hidden />
          Likely passenger
        </span>
      )}
      <span className="ml-auto font-mono text-xs">
        {meCount} ME + {coCount} CO
        {totalResults > shownResults ? ` of ${totalResults}` : ""}
      </span>
    </div>
  );
}
