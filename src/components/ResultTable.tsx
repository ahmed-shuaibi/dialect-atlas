import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, fmtInt, fmtLrt, fmtRho, fmtTau } from "@/lib/utils";
import type { Direction, Edge } from "@/lib/atlas";
import type { NetSelection } from "@/components/NetworkView";

type Row = Edge & { type: Direction };
type SortKey = "rho" | "lrt" | "tau11" | "n11";

const NUM_COLS: { key: SortKey; label: string; fmt: (r: Row) => string }[] = [
  { key: "rho", label: "rho", fmt: (r) => fmtRho(r.rho) },
  { key: "lrt", label: "LRT", fmt: (r) => fmtLrt(r.lrt) },
  { key: "tau11", label: "tau-11", fmt: (r) => fmtTau(r.tau11) },
  { key: "n11", label: "co-mut n", fmt: (r) => fmtInt(r.n11) },
];

function Th({
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
        "bg-card px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
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
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "rho" ? "asc" : "desc" },
    );

  return (
    <div className="surface overflow-hidden">
      <div className="max-h-[540px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border">
              <Th className="text-left">Gene pair</Th>
              <Th className="text-left">Type</Th>
              {NUM_COLS.map((c) => (
                <Th key={c.key} className="cursor-pointer select-none text-right" onClick={() => toggle(c.key)}>
                  <span className="inline-flex items-center justify-end gap-1">
                    {c.label}
                    {sort.key === c.key &&
                      (sort.dir === "asc" ? (
                        <ArrowUp className="size-3 text-brand" />
                      ) : (
                        <ArrowDown className="size-3 text-brand" />
                      ))}
                  </span>
                </Th>
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
                    <Badge variant={r.type === "ME" ? "me" : "co"}>{r.type}</Badge>
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
