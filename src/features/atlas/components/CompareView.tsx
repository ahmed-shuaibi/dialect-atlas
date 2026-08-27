import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EvidenceStatus, type EvidenceState } from "@/components/ui/evidence-status";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildComparisonRows,
  comparisonMethods,
  sortComparisonRows,
  type CompareEvidence,
  type CompareMethodId,
  type CompareSortDirection,
} from "@/features/atlas/components/compare-detail";
import { ResultsToolbar } from "@/features/atlas/components/ResultsToolbar";
import { DIRECTION_METADATA } from "@/features/atlas/lib/atlas-metadata";
import { fmtQ } from "@/features/atlas/lib/atlas-transform";
import type {
  CohortData,
  Direction,
  InteractionResult,
  ReleaseManifest,
} from "@/features/atlas/types";
import { cn } from "@/lib/utils";

const DISPLAY_LIMIT = 30;
const DIRECTION_OPTIONS = [
  { value: "ME", label: "Mutually exclusive" },
  { value: "CO", label: "Co-occurring" },
] as const;

function EvidenceMark({
  evidence,
  direction,
}: {
  evidence: CompareEvidence | undefined;
  direction: Direction;
}) {
  if (!evidence?.tested || evidence.value == null) {
    return <EvidenceStatus state="missing" label="Not reported" />;
  }
  const oppositeSignificant =
    !evidence.supported &&
    evidence.value < evidence.method.threshold &&
    (evidence.assignedDirection === "ME" || evidence.assignedDirection === "CO") &&
    evidence.assignedDirection !== direction;
  const state: EvidenceState = evidence.fallback || oppositeSignificant
    ? "warning"
    : evidence.supported
      ? "supported"
      : "unsupported";
  const significance = evidence.supported
    ? `supports ${direction}`
    : oppositeSignificant
      ? `supports ${evidence.assignedDirection}, opposite to ${direction}`
      : `does not support ${direction}`;
  const fallback = evidence.fallback ? "; CBaSE fallback" : "";
  const label = `${evidence.method.label}: ${significance}; ${evidence.method.measure} ${fmtQ(evidence.value)}${fallback}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="focus-ring inline-flex rounded-full p-1">
          <EvidenceStatus state={state} label={label} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function PassengerMarker({ features }: { features: string[] }) {
  if (features.length === 0) return null;
  return (
    <span className="ml-2 inline-flex align-middle">
      <span className="size-2 rounded-full bg-passenger" aria-hidden />
      <span className="sr-only">
        Likely passenger gene effect: {features.join(", ")}
      </span>
    </span>
  );
}

function ComparisonSection({
  data,
  manifestMethods,
  direction,
  qThreshold,
  query,
  likelyPassengers,
  highlightLikelyPassengers,
  onSelect,
}: {
  data: CohortData;
  manifestMethods: ReleaseManifest["methods"];
  direction: Direction;
  qThreshold: number;
  query: string;
  likelyPassengers: ReadonlySet<string>;
  highlightLikelyPassengers: boolean;
  onSelect: (result: InteractionResult) => void;
}) {
  const methods = useMemo(
    () => comparisonMethods(direction, manifestMethods, qThreshold),
    [direction, manifestMethods, qThreshold],
  );
  const [visible, setVisible] = useState(DISPLAY_LIMIT);
  const [sortMethod, setSortMethod] = useState<CompareMethodId>("cbase");
  const [sortDirection, setSortDirection] = useState<CompareSortDirection>("ascending");

  useEffect(() => {
    if (!methods.some((method) => method.id === sortMethod)) {
      setSortMethod(methods[0]?.id ?? "cbase");
      setSortDirection("ascending");
    }
  }, [methods, sortMethod]);
  useEffect(() => setVisible(DISPLAY_LIMIT), [qThreshold, query, sortMethod, sortDirection]);

  const rows = useMemo(
    () => buildComparisonRows(data, direction, methods),
    [data, direction, methods],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("en-US");
  const filtered = useMemo(() => {
    const matching = normalizedQuery
      ? rows.filter((row) => `${row.ga} ${row.gb}`.toLocaleLowerCase("en-US").includes(normalizedQuery))
      : rows;
    return sortComparisonRows(matching, sortMethod, sortDirection);
  }, [normalizedQuery, rows, sortDirection, sortMethod]);
  const shown = filtered.slice(0, visible);
  const activeMethod = methods.find((method) => method.id === sortMethod) ?? methods[0];

  const chooseSort = (method: CompareMethodId) => {
    if (method === sortMethod) {
      setSortDirection((value) => (value === "ascending" ? "descending" : "ascending"));
      return;
    }
    setSortMethod(method);
    setSortDirection("ascending");
  };

  return (
    <section aria-label={DIRECTION_METADATA[direction].label}>
      <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-muted">
          <span className="font-mono text-ink">{filtered.length}</span> pairs supported by at least one method
        </p>
        <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto md:hidden">
          <label className="min-w-0 flex-1 sm:flex-none">
            <span className="sr-only">Sort {direction} comparison by</span>
            <select
              aria-label={`Sort ${direction} comparison by`}
              value={sortMethod}
              onChange={(event) => {
                const method = methods.find(({ id }) => id === event.target.value);
                if (!method) return;
                setSortMethod(method.id);
                setSortDirection("ascending");
              }}
              className="focus-ring h-10 w-full min-w-0 rounded-full border border-line bg-paper px-3 text-sm font-semibold outline-none sm:w-auto"
            >
              {methods.map((method) => (
                <option key={method.id} value={method.id}>{method.label}</option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setSortDirection((value) => (value === "ascending" ? "descending" : "ascending"))}
            aria-label={`Sort ${sortDirection === "ascending" ? "descending" : "ascending"}`}
          >
            {sortDirection === "ascending" ? <ArrowUp className="size-4" aria-hidden /> : <ArrowDown className="size-4" aria-hidden />}
          </Button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="surface-card px-6 py-14 text-center">
          <p className="text-base font-semibold">No matching {direction} pairs.</p>
        </div>
      ) : (
        <>
          <div className="surface-card hidden overflow-hidden md:block">
            <table className="w-full table-fixed border-collapse text-[15px]">
              <caption className="sr-only">{direction} pairs supported by at least one displayed method</caption>
              <colgroup>
                <col className="w-[20%]" />
                {methods.map((method) => <col key={method.id} />)}
              </colgroup>
              <thead className="bg-sand/70">
                <tr>
                  <th className="px-5 py-4 text-left text-sm font-semibold">Pair</th>
                  {methods.map((method) => {
                    const active = sortMethod === method.id;
                    return (
                      <th key={method.id} aria-sort={active ? sortDirection : "none"} className="px-1 py-3 text-center">
                        <span className="inline-flex max-w-full items-center justify-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => chooseSort(method.id)}
                            className="focus-ring inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full px-1 py-1.5 text-xs font-semibold hover:bg-paper"
                            aria-label={`Sort by ${method.label}`}
                          >
                            <span className="truncate">{method.label}</span>
                            {active && (sortDirection === "ascending" ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}
                          </button>
                          <a
                            href={method.href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Read the ${method.label} method`}
                            className="focus-ring grid size-6 shrink-0 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink"
                          >
                            <ExternalLink className="size-3" aria-hidden />
                          </a>
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => {
                  const passengerFeatures = highlightLikelyPassengers
                    ? [row.ga, row.gb].filter((feature) => likelyPassengers.has(feature))
                    : [];
                  const likelyPassenger = passengerFeatures.length > 0;
                  return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-line transition-colors hover:bg-sand/45",
                      likelyPassenger && "bg-passenger-soft/65",
                    )}
                  >
                    <th className="px-5 py-3.5 text-left">
                      {row.result ? (
                        <button
                          type="button"
                          onClick={() => onSelect(row.result!)}
                          className="focus-ring max-w-full truncate rounded-full font-mono text-[13px] font-medium hover:underline"
                          aria-label={`${row.ga} / ${row.gb}`}
                        >
                          {row.ga} / {row.gb}
                        </button>
                      ) : (
                        <span className="block truncate font-mono text-[13px] font-medium">{row.ga} / {row.gb}</span>
                      )}
                      <PassengerMarker features={passengerFeatures} />
                    </th>
                    {methods.map((method) => (
                      <td key={method.id} className="px-1 py-3 text-center">
                        <EvidenceMark evidence={row.evidence[method.id]} direction={direction} />
                      </td>
                    ))}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 md:hidden">
            {shown.map((row) => {
              const passengerFeatures = highlightLikelyPassengers
                ? [row.ga, row.gb].filter((feature) => likelyPassengers.has(feature))
                : [];
              const likelyPassenger = passengerFeatures.length > 0;
              return (
              <article
                key={row.id}
                className={cn(
                  "surface-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5",
                  likelyPassenger && "border-passenger/40 bg-passenger-soft/65",
                )}
              >
                <div className="min-w-0">
                  {row.result ? (
                    <button type="button" onClick={() => onSelect(row.result!)} className="focus-ring block max-w-full truncate rounded-full font-mono text-[13px] font-medium hover:underline">
                      {row.ga} / {row.gb}
                    </button>
                  ) : (
                    <p className="truncate font-mono text-[13px] font-medium">{row.ga} / {row.gb}</p>
                  )}
                  <PassengerMarker features={passengerFeatures} />
                  <p className="mt-1 text-xs font-semibold text-muted">{activeMethod?.label}</p>
                </div>
                <EvidenceMark evidence={row.evidence[sortMethod]} direction={direction} />
              </article>
              );
            })}
          </div>

          {visible < filtered.length && (
            <div className="mt-4 text-center">
              <Button type="button" variant="ghost" size="sm" onClick={() => setVisible((value) => Math.min(filtered.length, value + DISPLAY_LIMIT))}>
                Show {Math.min(DISPLAY_LIMIT, filtered.length - visible)} more
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export type CompareViewProps = {
  data: CohortData;
  manifestMethods: ReleaseManifest["methods"];
  qThreshold: number;
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  customize: ReactNode;
  likelyPassengers: ReadonlySet<string>;
  highlightLikelyPassengers: boolean;
  onSelect: (result: InteractionResult) => void;
};

export function CompareView({
  data,
  manifestMethods,
  qThreshold,
  direction,
  onDirectionChange,
  customize,
  likelyPassengers,
  highlightLikelyPassengers,
  onSelect,
}: CompareViewProps) {
  const [query, setQuery] = useState("");
  useEffect(() => setQuery(""), [data.id]);

  return (
    <TooltipProvider delayDuration={120}>
      <section aria-label="Method comparison">
        <ResultsToolbar
          controls={(
            <SegmentedControl
              value={direction}
              options={DIRECTION_OPTIONS}
              onChange={onDirectionChange}
              label="Interaction direction"
            />
          )}
          search={(
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Find a gene"
              label="Search compared gene pairs"
            />
          )}
          customize={customize}
        />
        {highlightLikelyPassengers && (
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted">
            <span className="size-2.5 rounded-full bg-passenger" aria-hidden />
            Likely passenger gene effect
          </div>
        )}
        <div className="view-enter" key={direction}>
          <ComparisonSection
            data={data}
            manifestMethods={manifestMethods}
            direction={direction}
            qThreshold={qThreshold}
            query={query}
            likelyPassengers={likelyPassengers}
            highlightLikelyPassengers={highlightLikelyPassengers}
            onSelect={onSelect}
          />
        </div>
      </section>
    </TooltipProvider>
  );
}
