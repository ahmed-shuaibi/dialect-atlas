import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, fmtInt, fmtLrt, fmtRho, fmtTau } from "@/lib/utils";
import type { Direction, Edge } from "@/lib/atlas";
import type { NetSelection } from "@/components/NetworkView";

type Row = Edge & { type: Direction };
type SortKey = "rho" | "lrt" | "tau11" | "n11";

const NUM_COLS: { key: SortKey; label: string; help: string; fmt: (r: Row) => string }[] = [
  {
    key: "rho",
    label: "ρ",
    help: "Bivariate-Bernoulli correlation of the two genes' driver mutations. Negative → mutually exclusive; positive → co-occurring.",
    fmt: (r) => fmtRho(r.rho),
  },
  {
    key: "lrt",
    label: "LRT",
    help: "Likelihood-ratio statistic for the dependency. Higher means stronger statistical evidence.",
    fmt: (r) => fmtLrt(r.lrt),
  },
  {
    key: "tau11",
    label: "τ₁₁",
    help: "Estimated probability that a tumor carries a driver mutation in both genes.",
    fmt: (r) => fmtTau(r.tau11),
  },
  {
    key: "n11",
    label: "co-mut",
    help: "Number of tumors with a driver mutation in both genes (top-left contingency cell).",
    fmt: (r) => fmtInt(r.n11),
  },
];

function HeaderCell({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        "bg-card px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

function DetailRow({ r }: { r: Row }) {
  const Cell = ({ n, hi }: { n: number; hi?: boolean }) => (
    <td
      className={cn(
        "border border-border px-3 py-1.5 text-center font-mono text-[13px] tnum",
        hi ? "bg-white/[0.06] text-foreground" : "text-muted-foreground-strong",
      )}
    >
      {fmtInt(n)}
    </td>
  );
  return (
    <tr className="bg-white/[0.02]">
      <td colSpan={6} className="px-4 py-4">
        <div className="text-xs text-muted-foreground">
          Tumors by mutation status &nbsp;·&nbsp; rows = {r.ga}, columns = {r.gb}
        </div>
        <table className="mt-2 border-collapse text-[13px]">
          <tbody>
            <tr>
              <td className="px-3 py-1" />
              <td className="px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {r.gb} mut
              </td>
              <td className="px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {r.gb} wt
              </td>
            </tr>
            <tr>
              <td className="px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {r.ga} mut
              </td>
              <Cell n={r.n11} hi />
              <Cell n={r.n10} />
            </tr>
            <tr>
              <td className="px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {r.ga} wt
              </td>
              <Cell n={r.n01} />
              <Cell n={r.n00} />
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

export function ResultTable({
  rows,
  selected,
  onSelect,
  defaultSort,
}: {
  rows: Row[];
  selected: NetSelection | null;
  onSelect: (s: NetSelection | null) => void;
  defaultSort: { key: SortKey; dir: "asc" | "desc" };
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

  return (
    <div className="surface overflow-hidden">
      <div className="max-h-[540px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border">
              <HeaderCell className="text-left">Gene pair</HeaderCell>
              <HeaderCell className="text-left">Type</HeaderCell>
              {NUM_COLS.map((c) => (
                <HeaderCell key={c.key} className="cursor-pointer select-none text-right" onClick={() => toggle(c.key)}>
                  <span className="inline-flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-2">
                          {c.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{c.help}</TooltipContent>
                    </Tooltip>
                    {sort.key === c.key &&
                      (sort.dir === "asc" ? (
                        <ArrowUp className="size-3 text-brand" />
                      ) : (
                        <ArrowDown className="size-3 text-brand" />
                      ))}
                  </span>
                </HeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const isSel =
                selected != null &&
                selected.a === r.a &&
                selected.b === r.b &&
                selected.type === r.type;
              return (
                <>
                  <tr
                    key={`${r.ga}-${r.gb}-${r.type}-${i}`}
                    onClick={() => onSelect(isSel ? null : { a: r.a, b: r.b, type: r.type })}
                    className={cn(
                      "cursor-pointer border-b border-border/50 transition-colors",
                      isSel ? "bg-white/[0.05]" : "hover:bg-white/[0.03]",
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[13px] text-foreground">
                      {r.ga} <span className="text-muted-foreground">:</span> {r.gb}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground-strong">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: r.type === "ME" ? "var(--me-color)" : "var(--co-color)" }}
                        />
                        {r.type}
                      </span>
                    </td>
                    {NUM_COLS.map((c) => (
                      <td
                        key={c.key}
                        className="px-4 py-2.5 text-right font-mono text-[13px] text-muted-foreground-strong tnum"
                      >
                        {c.fmt(r)}
                      </td>
                    ))}
                  </tr>
                  {isSel && <DetailRow key={`${r.ga}-${r.gb}-${r.type}-${i}-d`} r={r} />}
                </>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No dependencies for this selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
