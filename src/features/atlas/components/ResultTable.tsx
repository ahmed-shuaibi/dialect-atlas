import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { Badge, EdgeSwatch } from "@/components/ui/badge";
import { InfoTip } from "@/features/atlas/components/InfoTip";
import { ContingencyRow } from "@/features/atlas/components/ContingencyRow";
import { cn, fmtInt, fmtLrt, fmtRho, fmtTau } from "@/lib/utils";
import type { Row } from "@/features/atlas/types";
import type { NetSelection } from "@/features/atlas/components/NetworkView";

type SortKey = "rho" | "lrt" | "tau11" | "n11";

type NumCol = {
  key: SortKey;
  label: ReactNode;
  /** accessible name for the InfoTip glyph */
  tip: string;
  help: ReactNode;
  fmt: (r: Row) => string;
  /** collapsed behind the expand row below 640px */
  mobileHidden?: boolean;
};

const NUM_COLS: NumCol[] = [
  {
    key: "rho",
    label: "ρ",
    tip: "About ρ (correlation)",
    help: "Bivariate-Bernoulli correlation of the two genes' driver mutations. Negative (blue) → mutually exclusive; positive (amber) → co-occurring. The in-cell bar repeats the sign and magnitude.",
    fmt: (r) => fmtRho(r.rho),
  },
  {
    key: "lrt",
    label: "LRT",
    tip: "About the LRT statistic",
    help: "Likelihood-ratio statistic against the no-dependency null. Asymptotically χ² with 1 df, so larger values map to smaller p (e.g. LRT ≈ 3.84 → p ≈ 0.05; ≈ 10.83 → p ≈ 0.001). Higher = stronger evidence for the dependency.",
    fmt: (r) => fmtLrt(r.lrt),
  },
  {
    key: "tau11",
    label: "τ₁₁",
    tip: "About τ₁₁",
    help: "Estimated probability that a tumor carries a driver mutation in both genes simultaneously.",
    fmt: (r) => fmtTau(r.tau11),
    mobileHidden: true,
  },
  {
    key: "n11",
    label: "co-mut",
    tip: "About co-mutated count",
    help: "Number of tumors with a driver mutation in both genes (top-left cell of the 2×2 contingency table).",
    fmt: (r) => fmtInt(r.n11),
    mobileHidden: true,
  },
];

/** Diverging in-cell ρ encoding: signed number + a mini-bar growing left (blue/ME) or
 * right (amber/CO) from a center baseline. Redundant with the number and the Type badge —
 * never hue alone. |ρ| ∈ [0,1] maps to up to half the cell width. */
function RhoCell({ r }: { r: Row }) {
  const me = r.rho < 0;
  const pct = Math.min(Math.abs(r.rho), 1) * 50;
  return (
    <td className="relative px-4 py-0 text-right font-mono text-meta tnum">
      {/* center baseline */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1/2 w-px bg-border"
      />
      {/* diverging bar */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-2 rounded-[2px]"
        style={{
          left: me ? `${50 - pct}%` : "50%",
          width: `${pct}%`,
          background: me ? "var(--me-color)" : "var(--co-color)",
          opacity: 0.22,
        }}
      />
      <span className={cn("relative", me ? "text-me" : "text-co")}>{fmtRho(r.rho)}</span>
    </td>
  );
}

function SortHeader({
  col,
  sort,
  onToggle,
  className,
}: {
  col: NumCol;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onToggle: (k: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === col.key;
  const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
  return (
    <th
      aria-sort={ariaSort}
      className={cn(
        "bg-card px-4 py-2 font-mono text-eyebrow font-medium uppercase tracking-[0.12em] text-muted-foreground-strong",
        className,
      )}
    >
      <span className="inline-flex items-center justify-end gap-label">
        <InfoTip label={col.tip} side="top">
          {col.help}
        </InfoTip>
        <button
          type="button"
          onClick={() => onToggle(col.key)}
          className="focus-ring inline-flex items-center gap-intra rounded-md uppercase tracking-[0.12em] transition-colors hover:text-foreground"
        >
          <span>{col.label}</span>
          {active ? (
            sort.dir === "asc" ? (
              <ArrowUp className="size-3 text-brand" aria-hidden />
            ) : (
              <ArrowDown className="size-3 text-brand" aria-hidden />
            )
          ) : (
            <span className="size-3" aria-hidden />
          )}
        </button>
      </span>
    </th>
  );
}

export function ResultTable({
  rows,
  selected,
  onSelect,
  defaultSort,
  nModels,
}: {
  rows: Row[];
  selected: NetSelection | null;
  onSelect: (s: NetSelection | null) => void;
  defaultSort: { key: SortKey; dir: "asc" | "desc" };
  /** Number of background-rate models available for this cohort (the robustness denominator). */
  nModels: number;
}) {
  const [sort, setSort] = useState(defaultSort);

  const sorted = useMemo(() => {
    const s = [...rows].sort((a, b) => a[sort.key] - b[sort.key]);
    return sort.dir === "asc" ? s : s.reverse();
  }, [rows, sort]);

  const toggle = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" },
    );

  const colCount = 4 + NUM_COLS.length; // expand + pair + type + numerics + models

  return (
    <div className="space-y-label">
      <p className="text-meta text-muted-foreground-strong">
        Select a pair to expand its 2×2 contingency table and highlight it in the network.
      </p>
      <div className="surface relative overflow-hidden">
        {/* scroll-shadow affordance: a right-edge fade cues horizontal overflow on narrow
            viewports (where τ / co-mut collapse). Pointer-events-none so it never blocks rows. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-gradient-to-l from-background/80 to-transparent sm:hidden"
        />
        <div className="max-h-[540px] overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border">
                <th aria-hidden className="w-8 bg-card px-2 py-2" />
                <th className="bg-card px-4 py-2 text-left font-mono text-eyebrow font-medium uppercase tracking-[0.12em] text-muted-foreground-strong">
                  Gene pair
                </th>
                <th className="bg-card px-4 py-2 text-left font-mono text-eyebrow font-medium uppercase tracking-[0.12em] text-muted-foreground-strong">
                  Type
                </th>
                {NUM_COLS.map((c) => (
                  <SortHeader
                    key={c.key}
                    col={c}
                    sort={sort}
                    onToggle={toggle}
                    className={cn("text-right", c.mobileHidden && "hidden sm:table-cell")}
                  />
                ))}
                <th className="bg-card px-4 py-2 text-right font-mono text-eyebrow font-medium uppercase tracking-[0.12em] text-muted-foreground-strong">
                  <span className="inline-flex items-center justify-end gap-label">
                    <InfoTip label="About cross-model robustness">
                      How many of the cohort&apos;s {nModels} background-rate models recover this
                      same gene-effect pair in the same direction. {nModels}/{nModels} = robust to
                      the BMR choice.
                    </InfoTip>
                    Models
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const isSel =
                  selected != null &&
                  selected.a === r.ga &&
                  selected.b === r.gb &&
                  selected.type === r.type;
                const key = `${r.ga}-${r.gb}-${r.type}-${i}`;
                const select = () => onSelect(isSel ? null : { a: r.ga, b: r.gb, type: r.type });
                return (
                  <ResultRow
                    key={key}
                    r={r}
                    isSel={isSel}
                    colCount={colCount}
                    nModels={nModels}
                    onSelect={select}
                  />
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-12 text-center text-meta text-muted-foreground-strong"
                  >
                    No dependencies for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  r,
  isSel,
  colCount,
  nModels,
  onSelect,
}: {
  r: Row;
  isSel: boolean;
  colCount: number;
  nModels: number;
  onSelect: () => void;
}) {
  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={isSel}
        aria-label={`${r.ga} ${r.gb} ${r.type}, expand contingency table`}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={cn(
          "group cursor-pointer border-b border-border/50 transition-colors focus-ring focus-visible:relative focus-visible:z-[1]",
          isSel
            ? "bg-white/[0.05] ring-1 ring-inset ring-brand"
            : "hover:bg-white/[0.03]",
        )}
      >
        <td className="w-8 px-2 text-center align-middle">
          <ChevronRight
            aria-hidden
            className={cn(
              "inline size-3.5 text-muted-foreground-strong transition-transform group-hover:text-foreground",
              isSel && "rotate-90 text-brand",
            )}
          />
        </td>
        <td className="h-9 whitespace-nowrap px-4 py-0 align-middle font-mono text-meta text-foreground">
          <span className="inline-flex flex-wrap items-center gap-x-label gap-y-intra">
            <span>
              {r.ga} <span className="text-muted-foreground">:</span> {r.gb}
            </span>
            {r.isPassenger && (
              <Badge
                variant="default"
                className="uppercase tracking-[0.12em] text-muted-foreground-strong"
                title="One gene is a long/hypermutation-prone locus; this pair is likely a length artifact, not a true dependency."
              >
                likely length artifact
              </Badge>
            )}
          </span>
        </td>
        <td className="px-4 py-0 align-middle">
          <Badge variant={r.type === "ME" ? "me" : "co"}>
            <EdgeSwatch type={r.type} />
            {r.type}
          </Badge>
        </td>
        <RhoCell r={r} />
        <td className="px-4 py-0 align-middle text-right font-mono text-meta text-muted-foreground-strong tnum">
          {fmtLrt(r.lrt)}
        </td>
        <td className="hidden px-4 py-0 align-middle text-right font-mono text-meta text-muted-foreground-strong tnum sm:table-cell">
          {fmtTau(r.tau11)}
        </td>
        <td className="hidden px-4 py-0 align-middle text-right font-mono text-meta text-muted-foreground-strong tnum sm:table-cell">
          {fmtInt(r.n11)}
        </td>
        <td className="px-4 py-0 align-middle text-right">
          <span
            className={cn(
              "font-mono text-meta tnum",
              r.replicatedIn === nModels ? "text-brand" : "text-muted-foreground-strong",
            )}
            title={`Recovered in ${r.replicatedIn} of ${nModels} background-rate models`}
          >
            {r.replicatedIn}/{nModels}
          </span>
        </td>
      </tr>
      {isSel && <ContingencyRow r={r} colSpan={colCount} />}
    </>
  );
}
