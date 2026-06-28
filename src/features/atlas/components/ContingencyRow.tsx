import { cn, fmtInt } from "@/lib/utils";
import type { Row } from "@/features/atlas/types";

/**
 * Expanded 2×2 contingency disclosure for a selected pair. Rendered as a full-width
 * cell beneath the pair's row. Tumor counts by joint driver-mutation status; the
 * co-mutation cell (n11) is emphasized since it drives the ME/CO signal.
 */
export function ContingencyRow({ r, colSpan }: { r: Row; colSpan: number }) {
  const Cell = ({ n, hi }: { n: number; hi?: boolean }) => (
    <td
      className={cn(
        "border border-border px-3 py-1.5 text-right font-mono text-meta tnum",
        hi ? "bg-white/[0.06] text-foreground" : "text-muted-foreground-strong",
      )}
    >
      {fmtInt(n)}
    </td>
  );
  const Lbl = ({ children }: { children: React.ReactNode }) => (
    <th
      scope="row"
      className="px-3 py-1 text-left font-mono text-eyebrow font-normal uppercase tracking-[0.12em] text-muted-foreground-strong"
    >
      {children}
    </th>
  );
  return (
    <tr className="bg-white/[0.02]">
      <td colSpan={colSpan} className="px-4 py-caption">
        <div className="mb-label text-meta text-muted-foreground-strong">
          Tumors by joint driver-mutation status
        </div>
        <table className="border-collapse">
          <caption className="sr-only">
            2×2 contingency table of tumor counts for {r.ga} and {r.gb}
          </caption>
          <thead>
            <tr>
              <td className="px-3 py-1" />
              <th
                scope="col"
                className="px-3 py-1 text-right font-mono text-eyebrow font-normal uppercase tracking-[0.12em] text-muted-foreground-strong"
              >
                {r.gb} mut
              </th>
              <th
                scope="col"
                className="px-3 py-1 text-right font-mono text-eyebrow font-normal uppercase tracking-[0.12em] text-muted-foreground-strong"
              >
                {r.gb} wt
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Lbl>{r.ga} mut</Lbl>
              <Cell n={r.n11} hi />
              <Cell n={r.n10} />
            </tr>
            <tr>
              <Lbl>{r.ga} wt</Lbl>
              <Cell n={r.n01} />
              <Cell n={r.n00} />
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}
