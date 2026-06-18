import { Badge } from "@/components/ui/badge";
import { BMR_LABEL, type Bmr, type Cohort, type Direction, type Edge } from "@/lib/atlas";
import { fmtInt, fmtLrt, fmtRho, fmtTau } from "@/lib/utils";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white/[0.02] px-3 py-2.5">
      <div className="font-mono text-base text-foreground tnum">{value}</div>
      <div className="eyebrow mt-1">{label}</div>
    </div>
  );
}

function Contingency({ e }: { e: Edge }) {
  const Cell = ({ n, hi }: { n: number; hi?: boolean }) => (
    <div
      className={`flex h-11 items-center justify-center rounded-md border border-border font-mono text-sm tnum ${
        hi ? "bg-white/[0.06] text-foreground" : "bg-white/[0.02] text-muted-foreground-strong"
      }`}
    >
      {fmtInt(n)}
    </div>
  );
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-1.5 text-[11px]">
      <div />
      <div className="eyebrow self-end pb-1 text-center">B mut</div>
      <div className="eyebrow self-end pb-1 text-center">B wt</div>
      <div className="eyebrow flex items-center justify-end pr-1">A mut</div>
      <Cell n={e.n11} hi />
      <Cell n={e.n10} />
      <div className="eyebrow flex items-center justify-end pr-1">A wt</div>
      <Cell n={e.n01} />
      <Cell n={e.n00} />
    </div>
  );
}

export function PairDetail({
  pair,
  cohort,
  bmr,
}: {
  pair: (Edge & { type: Direction }) | null;
  cohort: Cohort;
  bmr: Bmr;
}) {
  if (!pair) {
    return (
      <div className="surface flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="font-serif text-lg text-foreground">Inspect a dependency</p>
        <p className="max-w-[32ch] text-sm leading-relaxed text-muted-foreground">
          Click an edge in the network — or a row in the table — to see its statistics and 2×2
          contingency table.
        </p>
      </div>
    );
  }
  const isME = pair.type === "ME";
  return (
    <div className="surface flex h-full flex-col gap-5 p-5">
      <div>
        <div className="eyebrow mb-2">selected dependency</div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-lg">
          <span className="text-foreground">{pair.ga}</span>
          <span className="text-muted-foreground">×</span>
          <span className="text-foreground">{pair.gb}</span>
        </div>
        <div className="mt-2.5">
          <Badge variant={isME ? "me" : "co"}>{isME ? "mutually exclusive" : "co-occurring"}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="rho" value={fmtRho(pair.rho)} />
        <Stat label="LRT" value={fmtLrt(pair.lrt)} />
        <Stat label="tau-11" value={fmtTau(pair.tau11)} />
      </div>

      <div>
        <div className="eyebrow mb-2.5">contingency · samples</div>
        <Contingency e={pair} />
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="font-mono">{cohort.cohort.replace(/_/g, " ")}</span>
        <span>
          {BMR_LABEL[bmr]} · N={fmtInt(cohort.n_samples)}
        </span>
      </div>
    </div>
  );
}
