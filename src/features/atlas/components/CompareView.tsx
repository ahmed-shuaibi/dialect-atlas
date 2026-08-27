import { useEffect, useMemo, useState } from "react";
import { DirectionBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BMR_LABEL,
  baseGene,
  codePointCompare,
  findResultForMode,
  fmtQ,
  pairKey,
  resultsForMode,
} from "@/features/atlas/lib/atlas-transform";
import {
  BMR_IDS,
  type AtlasMode,
  type BaselineRow,
  type Bmr,
  type CohortData,
  type DialectRow,
  type Direction,
  type InteractionResult,
} from "@/features/atlas/types";
import { cn } from "@/lib/utils";

type ComparisonSource = "dialect" | "fisher" | "discover" | "megsa" | "wes";

type Evidence = {
  label: string;
  available: boolean;
  applicable: boolean;
  tested: boolean;
  value: number | null;
  supported: boolean;
  rule: string;
  note?: string;
  annotation?: string;
};

type ComparisonRow = {
  id: string;
  ga: string;
  gb: string;
  result: InteractionResult | null;
  baseline: BaselineRow | undefined;
};

const DISPLAY_LIMIT = 20;

function methodTokens(value: unknown): Set<string> {
  const out = new Set<string>();
  const add = (item: unknown) => {
    if (typeof item === "string") out.add(item.toLowerCase().replace(/[^a-z0-9]/g, ""));
    else if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>;
      add(rec.id ?? rec.name ?? rec.method ?? rec.label);
    }
  };
  if (Array.isArray(value)) value.forEach(add);
  else if (value && typeof value === "object") Object.keys(value as Record<string, unknown>).forEach(add);
  return out;
}

function baselineValue(row: BaselineRow, source: Exclude<ComparisonSource, "dialect">, direction: Direction) {
  if (source === "fisher") return direction === "ME" ? row.fisherMeQ : row.fisherCoQ;
  if (source === "discover") return direction === "ME" ? row.discoverMeQ : row.discoverCoQ;
  if (source === "megsa") return direction === "ME" ? row.megsaP : null;
  return direction === "ME" ? row.wesmeQ : row.wescoQ;
}

function baselineEvidence(
  row: BaselineRow | undefined,
  direction: Direction,
  method: Exclude<ComparisonSource, "dialect">,
  globallyAvailable: boolean,
): Evidence {
  const megsa = method === "megsa";
  const applicable = !megsa || direction === "ME";
  const value = row && applicable ? baselineValue(row, method, direction) : null;
  return {
    label:
      method === "fisher"
        ? "Fisher"
        : method === "discover"
          ? "DISCOVER"
          : megsa
            ? "MEGSA"
            : direction === "ME"
              ? "WeSME"
              : "WeSCO",
    available: globallyAvailable,
    applicable,
    tested: row != null,
    value,
    supported: value != null && value < (megsa ? 0.001 : 0.01),
    rule: megsa ? "p < 0.001" : "q < 0.01",
  };
}

function modelEvidence(
  row: DialectRow | undefined,
  bmr: Bmr,
  direction: Direction,
  cbaseFallback = false,
): Evidence {
  const directionMatches = row?.direction === direction;
  return {
    label: BMR_LABEL[bmr],
    available: true,
    applicable: true,
    tested: row != null,
    value: directionMatches ? (row.q ?? null) : null,
    supported: directionMatches && row.q != null && row.q < 0.01,
    rule: "q < 0.01",
    annotation: row && cbaseFallback ? "CBaSE fallback" : undefined,
    note:
      row && !directionMatches
        ? row.direction === "neutral"
          ? "neutral direction"
          : `${row.direction} direction`
        : undefined,
  };
}

function EvidenceCell({ evidence }: { evidence: Evidence }) {
  const text = !evidence.applicable
    ? "ME only"
    : !evidence.available
      ? "unavailable"
      : !evidence.tested
        ? "not tested"
        : evidence.note
          ? evidence.note
          : evidence.value == null
            ? "not reported"
            : fmtQ(evidence.value);
  const status = evidence.supported
    ? `supported; ${text}; ${evidence.rule}`
    : `${text}; not supported by ${evidence.rule}`;
  return (
    <td className="px-3 py-3 text-center">
      <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
        <span
          aria-hidden
          className={cn(
            "size-2 rounded-full",
            evidence.supported
              ? "bg-support"
              : evidence.tested && evidence.value != null
                ? "border border-muted/50"
                : "bg-line",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "font-mono text-[11px]",
            evidence.supported ? "font-bold text-support" : "text-muted",
          )}
        >
          {text}
        </span>
        <span className="sr-only">
          {evidence.label}: {status}{evidence.annotation ? `; ${evidence.annotation}; not a distinct MutSig lambda` : ""}
        </span>
      </span>
      {evidence.annotation && (
        <span className="mt-1 block text-[10px] font-bold text-alert">{evidence.annotation}</span>
      )}
    </td>
  );
}

export function CompareView({
  data,
  manifestMethods,
  mode,
  direction,
  strict,
  onDirectionChange,
  onSelect,
}: {
  data: CohortData;
  manifestMethods: unknown;
  mode: AtlasMode;
  direction: Direction;
  strict: boolean;
  onDirectionChange: (direction: Direction) => void;
  onSelect: (result: InteractionResult) => void;
}) {
  const [source, setSource] = useState<ComparisonSource>("dialect");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(DISPLAY_LIMIT);
  const methods = useMemo(() => {
    const tokens = methodTokens(manifestMethods);
    if (tokens.has("wesmewesco")) {
      tokens.add("wesme");
      tokens.add("wesco");
    }
    return tokens;
  }, [manifestMethods]);
  const known = methods.size > 0;
  const available = (name: string) => {
    if (!known) return true;
    const token = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return [...methods].some((method) => method === token || method.includes(token) || token.includes(method));
  };

  useEffect(() => {
    if (direction === "CO" && source === "megsa") setSource("dialect");
  }, [direction, source]);
  useEffect(() => setVisible(DISPLAY_LIMIT), [source, direction, strict, query]);

  const baselineByPair = useMemo(
    () => new Map(data.baselines.map((row) => [pairKey(row.ga, row.gb), row])),
    [data.baselines],
  );
  const dialectByModel = useMemo(
    () =>
      Object.fromEntries(
        BMR_IDS.map((bmr) => [
          bmr,
          new Map(data.models[bmr].map((row) => [pairKey(row.ga, row.gb), row])),
        ]),
      ) as Record<Bmr, Map<string, DialectRow>>,
    [data.models],
  );
  const mutsigFallback = useMemo(
    () => new Set(data.mutsigCbaseFallbackFeatures),
    [data.mutsigCbaseFallbackFeatures],
  );

  const rows = useMemo<ComparisonRow[]>(() => {
    if (source === "dialect") {
      return resultsForMode(data, mode, direction, strict).map((result) => ({
        id: result.id,
        ga: result.ga,
        gb: result.gb,
        result,
        baseline: baselineByPair.get(pairKey(result.ga, result.gb)),
      }));
    }
    return data.baselines
      .filter((row) => baseGene(row.ga) !== baseGene(row.gb))
      .map((baseline) => {
        const value = baselineValue(baseline, source, direction);
        const result = findResultForMode(
          data,
          { direction, ga: baseline.ga, gb: baseline.gb },
          mode,
          strict,
        );
        return { baseline, value, result };
      })
      .filter((item) => item.value != null)
      .filter((item) => !strict || item.result?.fdrSupport === BMR_IDS.length)
      .sort(
        (a, b) =>
          (a.value ?? 1) - (b.value ?? 1) ||
          codePointCompare(
            pairKey(a.baseline.ga, a.baseline.gb),
            pairKey(b.baseline.ga, b.baseline.gb),
          ),
      )
      .map(({ baseline, result }) => ({
        id: `${direction}::${pairKey(baseline.ga, baseline.gb)}`,
        ga: baseline.ga,
        gb: baseline.gb,
        result,
        baseline,
      }));
  }, [baselineByPair, data, direction, mode, source, strict]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? rows.filter((row) => `${row.ga} ${row.gb}`.toLowerCase().includes(normalizedQuery))
    : rows;
  const shown = filtered.slice(0, visible);
  const sources: { id: ComparisonSource; label: string; enabled: boolean }[] = [
    { id: "dialect", label: "DIALECT", enabled: true },
    { id: "fisher", label: "Fisher", enabled: available("fisher") },
    { id: "discover", label: "DISCOVER", enabled: available("discover") },
    { id: "megsa", label: "MEGSA", enabled: direction === "ME" && available("megsa") },
    {
      id: "wes",
      label: direction === "ME" ? "WeSME" : "WeSCO",
      enabled: available(direction === "ME" ? "wesme" : "wesco"),
    },
  ];

  return (
    <section aria-labelledby="compare-title">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-6">
        <div>
          <p className="eyebrow">Method comparison</p>
          <h2 id="compare-title" className="mt-3 text-[clamp(2rem,5vw,4.4rem)] font-black leading-none tracking-[-0.055em]">
            Compare the evidence.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Rank by any method. Missing means the pair was not tested in that method's K=100 feature universe.
          </p>
        </div>
        <div aria-label="Comparison direction" className="flex rounded-full border border-line bg-paper p-1">
          {(["ME", "CO"] as const).map((value) => (
            <Button
              key={value}
              variant={direction === value ? "primary" : "ghost"}
              size="sm"
              aria-pressed={direction === value}
              onClick={() => onDirectionChange(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2" aria-label="Rank pairs by method">
        {sources.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={!item.enabled}
            aria-pressed={source === item.id}
            onClick={() => setSource(item.id)}
            className={cn(
              "focus-ring rounded-full border px-4 py-2 text-xs font-bold transition-colors",
              source === item.id ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/30",
              !item.enabled && "cursor-not-allowed opacity-40",
            )}
          >
            {item.label}
          </button>
        ))}
        <label className="ml-auto min-w-[14rem] flex-1 sm:max-w-xs">
          <span className="sr-only">Search compared gene pairs</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a gene or pair"
            className="focus-ring w-full rounded-full border border-line bg-paper px-4 py-2 text-sm outline-none placeholder:text-muted"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
        <DirectionBadge direction={direction} />
        <span><span className="mr-1 inline-block size-2 rounded-full bg-support" /> supported</span>
        <span>DIALECT, Fisher, DISCOVER, WeSME/WeSCO: q &lt; 0.01</span>
        <span>MEGSA: ME-only, p &lt; 0.001</span>
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-line bg-paper/50 px-6 py-16 text-center">
          <p className="font-bold">No matching {direction} pairs in this view.</p>
          <p className="mt-2 text-sm text-muted">Try another method, search, direction, or strict setting.</p>
        </div>
      ) : (
        <>
          <div className="mt-8 overflow-x-auto rounded-[2rem] border border-line bg-paper shadow-soft [contain:layout_paint]">
            <table className="w-full min-w-[72rem] border-collapse text-sm">
              <caption className="sr-only">{direction} evidence ranked by {sources.find((item) => item.id === source)?.label}</caption>
              <thead className="bg-sand/70">
                <tr>
                  <th className="sticky left-0 z-10 bg-sand px-5 py-4 text-left text-xs font-bold">Pair</th>
                  {BMR_IDS.map((bmr) => (
                    <th key={bmr} className="px-3 py-4 text-center text-xs font-bold">{BMR_LABEL[bmr]}</th>
                  ))}
                  <th className="px-3 py-4 text-center text-xs font-bold">Fisher</th>
                  <th className="px-3 py-4 text-center text-xs font-bold">DISCOVER</th>
                  <th className="px-3 py-4 text-center text-xs font-bold">MEGSA</th>
                  <th className="px-3 py-4 text-center text-xs font-bold">{direction === "ME" ? "WeSME" : "WeSCO"}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => {
                  const key = pairKey(row.ga, row.gb);
                  const evidence = [
                    ...BMR_IDS.map((bmr) =>
                      modelEvidence(
                        dialectByModel[bmr].get(key),
                        bmr,
                        direction,
                        bmr === "mutsig" &&
                          (mutsigFallback.has(row.ga) || mutsigFallback.has(row.gb)),
                      ),
                    ),
                    baselineEvidence(row.baseline, direction, "fisher", available("fisher")),
                    baselineEvidence(row.baseline, direction, "discover", available("discover")),
                    baselineEvidence(row.baseline, direction, "megsa", available("megsa")),
                    baselineEvidence(
                      row.baseline,
                      direction,
                      "wes",
                      available(direction === "ME" ? "wesme" : "wesco"),
                    ),
                  ];
                  return (
                    <tr key={row.id} className="border-t border-line hover:bg-sand/40">
                      <th className="sticky left-0 z-[1] bg-paper px-5 py-3 text-left">
                        {row.result ? (
                          <button
                            type="button"
                            onClick={() => onSelect(row.result!)}
                            className="focus-ring rounded-lg font-mono text-xs font-semibold underline decoration-line underline-offset-4 hover:decoration-ink"
                          >
                            {row.ga} / {row.gb}
                          </button>
                        ) : (
                          <span className="font-mono text-xs font-semibold">{row.ga} / {row.gb}</span>
                        )}
                      </th>
                      {evidence.map((item, index) => (
                        <EvidenceCell key={`${item.label}-${index}`} evidence={item} />
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {visible < filtered.length && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setVisible((value) => Math.min(filtered.length, value + DISPLAY_LIMIT))}
                className="focus-ring rounded-full px-4 py-2 text-xs font-bold text-muted hover:bg-ink/[0.05] hover:text-ink"
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
