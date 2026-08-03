import { useMemo, type ReactNode } from "react";
import { Badge, EdgeSwatch } from "@/components/ui/badge";
import { cn, fmtInt, fmtLrt, fmtRho, fmtTau } from "@/lib/utils";
import { BMR_LABEL, pairKey } from "@/features/atlas/lib/atlas-transform";
import type { Atlas, Bmr, Cohort, Row } from "@/features/atlas/types";

/**
 * PairPopover — the Level-1 detail body (REDESIGN2 §3). Rendered inside a `PopoverContent`
 * anchored to a clicked network edge/node OR a ranked-table row; the two paths share one
 * `selected` pair so there is one detail surface, never two.
 *
 * Folds in the former `ContingencyRow` (the 2×2) and replaces the deleted `CrossModelStrip`
 * with a compact TRANSPOSED cross-model table (rows = ρ / LRT / τ₁₁, cols = the cohort's BMR
 * models). The strongest-agreeing model (highest LRT among the models that recover the pair)
 * gets a teal column; a model that drops the pair shows "—". Robustness is now a per-pair
 * detail, not a page-level strip.
 *
 * Pure/presentational: all cross-model lookup is derived from the already-hydrated cohort +
 * atlas index, so no fetching happens here.
 */
export function PairPopover({
  row,
  cohort,
  atlas,
  bmr,
}: {
  row: Row;
  cohort: Cohort;
  atlas: Atlas;
  /** The model currently in view — marked in the cross-model header so the popover self-locates. */
  bmr: Bmr;
}) {
  // Look up the same gene-effect pair, same direction, under every model the cohort carries.
  const { perModel, strongest } = useMemo(() => {
    const key = pairKey(row.ga, row.gb);
    const per = atlas.bmrs.map((b) => {
      const edge = cohort.bmrs[b]?.[row.type]?.edges.find((e) => pairKey(e.ga, e.gb) === key) ?? null;
      return { bmr: b, edge };
    });
    let best: Bmr | null = null;
    let bestLrt = -Infinity;
    for (const m of per) {
      if (m.edge && m.edge.lrt > bestLrt) {
        bestLrt = m.edge.lrt;
        best = m.bmr;
      }
    }
    return { perModel: per, strongest: best };
  }, [row.ga, row.gb, row.type, cohort, atlas]);

  const nModels = perModel.filter((m) => m.edge).length;
  const total = atlas.bmrs.length;
  const robust = nModels === total;

  const stat: { key: "rho" | "lrt" | "tau11"; label: ReactNode; fmt: (n: number) => string }[] = [
    { key: "rho", label: "ρ", fmt: fmtRho },
    { key: "lrt", label: "LRT", fmt: fmtLrt },
    { key: "tau11", label: "τ₁₁", fmt: fmtTau },
  ];

  return (
    <div className="w-[min(23rem,88vw)] space-y-caption p-4">
      {/* header: the pair + its direction */}
      <div className="flex items-center justify-between gap-caption">
        <span className="font-mono text-meta text-foreground">
          {row.ga} <span className="text-muted-foreground">:</span> {row.gb}
        </span>
        <Badge variant={row.type === "ME" ? "me" : "co"}>
          <EdgeSwatch type={row.type} />
          {row.type}
        </Badge>
      </div>

      {/* Level-1 stats for the model in view (defs live on the table headers, not repeated here) */}
      <div className="grid grid-cols-3 gap-caption">
        <Prop label="ρ">
          <span className={row.rho < 0 ? "text-me" : "text-co"}>{fmtRho(row.rho)}</span>
        </Prop>
        <Prop label="LRT">{fmtLrt(row.lrt)}</Prop>
        <Prop label="τ₁₁">{fmtTau(row.tau11)}</Prop>
      </div>

      {/* 2×2 contingency (folded from ContingencyRow) — observed tumor counts by joint mutation
          status (any mutation; raw, so the both-mutated cell exceeds the driver-latent τ₁₁ above).
          DIALECT convention (identify.py: confusion_matrix(a>0, b>0, labels=[1,0]); _00_=cm[0,0]):
          the n00 field is BOTH-MUTATED (cm[0,0], both labels=1) and n11 is BOTH-WILD-TYPE — the field
          index, not the mutation value. Verified against the data (both-mut is the smallest cell,
          both-wt the largest). So n00 → the ga-mut × gb-mut corner (top-left, highlighted). */}
      <div className="space-y-label">
        <p className="eyebrow">contingency · tumors mutated</p>
        <table className="w-full border-collapse">
          <caption className="sr-only">
            2×2 contingency table of observed tumor counts (any mutation) for {row.ga} and {row.gb}
          </caption>
          <thead>
            <tr>
              <td className="px-2 py-1" />
              <ContHead>{row.gb} mut</ContHead>
              <ContHead>{row.gb} wt</ContHead>
            </tr>
          </thead>
          <tbody>
            <tr>
              <ContLbl>{row.ga} mut</ContLbl>
              <ContCell n={row.n00} hi />
              <ContCell n={row.n01} />
            </tr>
            <tr>
              <ContLbl>{row.ga} wt</ContLbl>
              <ContCell n={row.n10} />
              <ContCell n={row.n11} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Transposed cross-model robustness — replaces the deleted 3-up CrossModelStrip */}
      <div className="space-y-label">
        <div className="flex items-baseline justify-between gap-caption">
          <p className="eyebrow">across models</p>
          <span className="inline-flex items-center gap-1.5 font-mono text-eyebrow tnum text-muted-foreground-strong">
            <RobustDot solid={robust} />
            {nModels}/{total}
          </span>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <td className="px-2 py-1" />
              {perModel.map((m) => (
                <th
                  key={m.bmr}
                  scope="col"
                  className={cn(
                    "px-2 py-1 text-right font-mono text-eyebrow font-normal",
                    m.bmr === strongest ? "text-brand" : "text-muted-foreground-strong",
                  )}
                >
                  {BMR_LABEL[m.bmr]}
                  {m.bmr === bmr && <span className="ml-1 opacity-50">•</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stat.map((s) => (
              <tr key={s.key}>
                <ContLbl>{s.label}</ContLbl>
                {perModel.map((m) => {
                  const teal = m.bmr === strongest && !!m.edge;
                  return (
                    <td
                      key={m.bmr}
                      className={cn(
                        "border border-border px-2 py-1 text-right font-mono text-meta tnum",
                        m.edge
                          ? teal
                            ? "bg-brand-soft/25 text-brand"
                            : "text-muted-foreground-strong"
                          : "text-muted-foreground-stronger",
                      )}
                    >
                      {m.edge ? s.fmt(m.edge[s.key]) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Label-over-value stack (the shared "PropertyRow" idiom). */
function Prop({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-intra">
      <p className="eyebrow">{label}</p>
      <p className="font-mono text-meta tnum text-foreground">{children}</p>
    </div>
  );
}

/** Solid = all models agree; hollow ring = split across models. */
function RobustDot({ solid }: { solid: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 rounded-full",
        solid ? "bg-brand" : "border border-muted-foreground-strong",
      )}
    />
  );
}

function ContHead({ children }: { children: ReactNode }) {
  return (
    <th
      scope="col"
      className="px-2 py-1 text-right font-mono text-eyebrow font-normal uppercase tracking-[0.12em] text-muted-foreground-strong"
    >
      {children}
    </th>
  );
}

function ContLbl({ children }: { children: ReactNode }) {
  return (
    <th
      scope="row"
      className="whitespace-nowrap px-2 py-1 text-left font-mono text-eyebrow font-normal uppercase tracking-[0.12em] text-muted-foreground-strong"
    >
      {children}
    </th>
  );
}

function ContCell({ n, hi }: { n: number; hi?: boolean }) {
  return (
    <td
      className={cn(
        "border border-border px-2 py-1 text-right font-mono text-meta tnum",
        hi ? "bg-white/[0.06] text-foreground" : "text-muted-foreground-strong",
      )}
    >
      {fmtInt(n)}
    </td>
  );
}
