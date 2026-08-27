import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildComparisonRows,
  comparisonMethods,
  sortComparisonRows,
  type CompareEvidence,
  type CompareMethodId,
  type CompareSortDirection,
} from "@/features/atlas/components/compare-detail";
import { fmtQ } from "@/features/atlas/lib/atlas-transform";
import type {
  AtlasMode,
  CohortData,
  Direction,
  InteractionResult,
} from "@/features/atlas/types";
import { cn } from "@/lib/utils";

const DISPLAY_LIMIT = 30;

function EvidenceMark({
  evidence,
  direction,
}: {
  evidence: CompareEvidence | undefined;
  direction: Direction;
}) {
  if (!evidence?.tested || evidence.value == null) {
    return (
      <span className="font-mono text-xs text-muted" aria-label="Not reported">
        —
      </span>
    );
  }
  const directionNote = evidence.assignedDirection
    ? `; ${evidence.assignedDirection === "neutral" ? "neutral" : evidence.assignedDirection} direction`
    : "";
  const fallbackNote = evidence.fallback ? "; CBaSE fallback" : "";
  const oppositeSignificant =
    !evidence.supported &&
    evidence.value < evidence.method.threshold &&
    (evidence.assignedDirection === "ME" || evidence.assignedDirection === "CO") &&
    evidence.assignedDirection !== direction;
  const significanceNote = evidence.supported
    ? `significant for ${direction}`
    : oppositeSignificant
      ? `significant for ${evidence.assignedDirection}; opposite to ${direction}`
      : `not significant for ${direction}`;
  return (
    <span
      className="inline-flex flex-col items-center justify-center whitespace-nowrap"
      title={`${evidence.method.label}: ${significanceNote}; ${evidence.method.measure} ${fmtQ(evidence.value)}${directionNote}${fallbackNote}`}
    >
      <span className="inline-flex items-baseline justify-center gap-1.5">
        <span
          aria-hidden
          className={cn(
            "text-sm font-black",
            evidence.fallback || oppositeSignificant
              ? "text-alert"
              : evidence.supported
                ? "text-support"
                : "text-muted",
          )}
        >
          {evidence.fallback || oppositeSignificant ? "△" : evidence.supported ? "✓" : "○"}
        </span>
        <span
          aria-hidden
          className={cn(
            "font-mono text-[11px] tabular-nums",
            evidence.fallback || oppositeSignificant
              ? "font-semibold text-alert"
              : evidence.supported
                ? "font-semibold text-ink"
                : "text-muted",
          )}
        >
          {fmtQ(evidence.value)}
        </span>
      </span>
      {evidence.fallback && (
        <span aria-hidden className="mt-0.5 text-[8px] font-bold leading-none text-alert">
          CBaSE fallback
        </span>
      )}
      <span className="sr-only">
        {evidence.method.label}: {significanceNote}; {evidence.method.measure} {fmtQ(evidence.value)}
        {directionNote}
        {fallbackNote}
      </span>
    </span>
  );
}

export type CompareViewProps = {
  data: CohortData;
  manifestMethods: unknown;
  mode: AtlasMode;
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  onSelect: (result: InteractionResult) => void;
};

export function CompareView(props: CompareViewProps) {
  const { data, manifestMethods, direction, onDirectionChange, onSelect } = props;
  const methods = useMemo(
    () => comparisonMethods(direction, manifestMethods),
    [direction, manifestMethods],
  );
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(DISPLAY_LIMIT);
  const [sortMethod, setSortMethod] = useState<CompareMethodId>("cbase");
  const [sortDirection, setSortDirection] =
    useState<CompareSortDirection>("ascending");

  useEffect(() => {
    if (!methods.some((method) => method.id === sortMethod)) {
      setSortMethod(methods[0]?.id ?? "cbase");
      setSortDirection("ascending");
    }
  }, [methods, sortMethod]);
  useEffect(() => setVisible(DISPLAY_LIMIT), [direction, query, sortMethod, sortDirection]);

  const rows = useMemo(
    () => buildComparisonRows(data, direction, methods),
    [data, direction, methods],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const matching = normalizedQuery
      ? rows.filter((row) =>
          `${row.ga} ${row.gb}`.toLowerCase().includes(normalizedQuery),
        )
      : rows;
    return sortComparisonRows(matching, sortMethod, sortDirection);
  }, [normalizedQuery, rows, sortDirection, sortMethod]);
  const shown = filtered.slice(0, visible);
  const activeMethod =
    methods.find((method) => method.id === sortMethod) ?? methods[0];

  const chooseSort = (method: CompareMethodId) => {
    if (method === sortMethod) {
      setSortDirection((value) =>
        value === "ascending" ? "descending" : "ascending",
      );
      return;
    }
    setSortMethod(method);
    setSortDirection("ascending");
  };

  return (
    <section aria-labelledby="compare-title">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <h2
          id="compare-title"
          className="text-[clamp(1.8rem,4vw,3rem)] font-black leading-none tracking-[-0.045em]"
        >
          Compare methods
        </h2>
        <div
          aria-label="Comparison direction"
          className="flex border border-line bg-paper p-1"
        >
          {(["ME", "CO"] as const).map((value) => (
            <Button
              key={value}
              variant={direction === value ? "primary" : "ghost"}
              size="sm"
              aria-pressed={direction === value}
              onClick={() => onDirectionChange(value)}
              className="rounded-none"
            >
              {value === "ME" ? "Mutually exclusive" : "Co-occurring"}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="min-w-[15rem] flex-1 sm:max-w-sm">
          <span className="sr-only">Search compared gene pairs</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search genes"
            className="focus-ring w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none placeholder:text-muted"
          />
        </label>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <label>
            <span className="sr-only">Sort comparison by</span>
            <select
              aria-label="Sort comparison by"
              value={sortMethod}
              onChange={(event) => {
                setSortMethod(event.target.value as CompareMethodId);
                setSortDirection("ascending");
              }}
              className="focus-ring border border-line bg-paper px-3 py-2.5 text-xs font-bold outline-none"
            >
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label} ({method.measure})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() =>
              setSortDirection((value) =>
                value === "ascending" ? "descending" : "ascending",
              )
            }
            className="focus-ring grid size-10 place-items-center border border-line bg-paper font-mono text-sm font-bold"
            aria-label={`Sort ${sortDirection === "ascending" ? "descending" : "ascending"}`}
          >
            {sortDirection === "ascending" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 border border-dashed border-line bg-paper/50 px-6 py-14 text-center">
          <p className="font-bold">No matching {direction} pairs.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-hidden border border-line bg-paper shadow-soft md:block">
            <table className="w-full table-fixed border-collapse text-sm">
              <caption className="sr-only">
                {direction} pairs significant in at least one displayed method
              </caption>
              <colgroup>
                <col className="w-[25%]" />
                {methods.map((method) => (
                  <col key={method.id} />
                ))}
              </colgroup>
              <thead className="bg-sand/70">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold">Pair</th>
                  {methods.map((method) => {
                    const active = sortMethod === method.id;
                    return (
                      <th
                        key={method.id}
                        aria-sort={active ? sortDirection : "none"}
                        className="px-1 py-2 text-center"
                      >
                        <button
                          type="button"
                          onClick={() => chooseSort(method.id)}
                          className="focus-ring inline-flex max-w-full items-center justify-center gap-1 px-1 py-1 text-[10px] font-bold leading-tight sm:text-[11px]"
                          aria-label={`Sort by ${method.label}`}
                        >
                          <span className="min-w-0 truncate">{method.label}</span>
                          <span className="shrink-0 font-mono text-[9px] text-muted">
                            {method.measure}{active ? (sortDirection === "ascending" ? " ↑" : " ↓") : ""}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => (
                  <tr key={row.id} className="border-t border-line hover:bg-sand/35">
                    <th className="px-4 py-2.5 text-left">
                      {row.result ? (
                        <button
                          type="button"
                          onClick={() => onSelect(row.result!)}
                          className="focus-ring max-w-full truncate font-mono text-xs font-semibold underline decoration-line underline-offset-4 hover:decoration-ink"
                          aria-label={`${row.ga} / ${row.gb}`}
                        >
                          {row.ga} / {row.gb}
                        </button>
                      ) : (
                        <span className="block truncate font-mono text-xs font-semibold">
                          {row.ga} / {row.gb}
                        </span>
                      )}
                    </th>
                    {methods.map((method) => (
                      <td key={method.id} className="px-1 py-2.5 text-center">
                        <EvidenceMark evidence={row.evidence[method.id]} direction={direction} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 space-y-2 md:hidden">
            {shown.map((row) => (
              <article
                key={row.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-line bg-paper px-4 py-3"
              >
                <div className="min-w-0">
                  {row.result ? (
                    <button
                      type="button"
                      onClick={() => onSelect(row.result!)}
                      className="focus-ring block max-w-full truncate font-mono text-xs font-semibold underline decoration-line underline-offset-4"
                      aria-label={`${row.ga} / ${row.gb}`}
                    >
                      {row.ga} / {row.gb}
                    </button>
                  ) : (
                    <p className="truncate font-mono text-xs font-semibold">
                      {row.ga} / {row.gb}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] font-bold text-muted">
                    {activeMethod?.label} · {activeMethod?.measure}
                  </p>
                </div>
                <EvidenceMark evidence={row.evidence[sortMethod]} direction={direction} />
              </article>
            ))}
          </div>

          {visible < filtered.length && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() =>
                  setVisible((value) =>
                    Math.min(filtered.length, value + DISPLAY_LIMIT),
                  )
                }
                className="focus-ring px-4 py-2 text-xs font-bold text-muted hover:bg-ink/[0.05] hover:text-ink"
              >
                Show {Math.min(DISPLAY_LIMIT, filtered.length - visible)} more
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
