import { Badge, EdgeSwatch } from "@/components/ui/badge";
import { cn, fmtInt, fmtRho } from "@/lib/utils";
import {
  BMR_LABEL,
  BMR_SUB,
  bmrCounts,
  dirs,
  isPassengerEdge,
  pairKey,
  replicatedIn,
} from "@/features/atlas/lib/atlas-transform";
import type { Atlas, Bmr, Cohort, Direction, DirFilter } from "@/features/atlas/types";

/** How many top pairs each mini-list shows. Dense, but readable at a glance. */
const PEEK = 5;

type Peek = {
  key: string;
  ga: string;
  gb: string;
  type: Direction;
  rho: number;
  /** replicated in N of the available models, same gene-effect pair + direction */
  rep: number;
};

/**
 * Top pairs for one BMR model in the active direction, mirroring the table's ranking
 * (top-K order from the shipped data, passengers dropped, ME before CO when "both").
 */
function peekFor(c: Cohort, atlas: Atlas, bmr: Bmr, dir: DirFilter): Peek[] {
  const b = c.bmrs[bmr];
  if (!b) return [];
  const out: Peek[] = [];
  for (const d of dirs(dir)) {
    for (const e of b[d].edges) {
      if (isPassengerEdge(e)) continue;
      out.push({
        key: pairKey(e.ga, e.gb),
        ga: e.ga,
        gb: e.gb,
        type: d,
        rho: e.rho,
        rep: replicatedIn(c, atlas, e.ga, e.gb, d),
      });
      if (out.length >= PEEK) return out;
    }
  }
  return out;
}

/**
 * Cross-model robustness as 3-up small multiples (H5) — the atlas's most novel axis made
 * legible. One card per BMR model showing its top pairs in the active direction, with a
 * "3/3" badge on pairs replicated across every available model (the robust DIALECT calls).
 * Lightweight context band (hairline column dividers, only the active model tinted) that
 * defers to the ranked table below — the table is the hero.
 */
export function CrossModelStrip({
  atlas,
  cohort,
  bmr,
  dir,
}: {
  atlas: Atlas;
  cohort: Cohort;
  bmr: Bmr;
  /** Active direction filter; "both" lists ME then CO. */
  dir: DirFilter;
}) {
  const nModels = atlas.bmrs.filter((b) => cohort.bmrs[b]).length;
  const countFor = (b: Bmr) => {
    const c = bmrCounts(cohort, b);
    return dir === "both" ? c.ME + c.CO : c[dir];
  };

  return (
    <section aria-label="Cross-model robustness">
      <div className="mb-caption flex items-baseline justify-between gap-control-row">
        <h2 className="eyebrow">across background-rate models</h2>
        <span className="font-mono text-eyebrow text-muted-foreground-strong">
          <span className="tnum text-foreground">{nModels}/{nModels}</span> = replicated in all
          models
        </span>
      </div>

      <div className="surface grid grid-cols-1 divide-y divide-border overflow-hidden sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {atlas.bmrs.map((b) => {
          const active = b === bmr;
          const total = countFor(b);
          const top = peekFor(cohort, atlas, b, dir);
          return (
            <article
              key={b}
              className={cn("px-caption py-label", active && "bg-brand-soft/20")}
            >
              <div className="flex items-baseline justify-between gap-label">
                <span className="font-mono text-meta text-foreground">{BMR_LABEL[b]}</span>
                {active ? (
                  <Badge variant="count" className="text-brand">
                    selected
                  </Badge>
                ) : (
                  <span className="font-mono text-eyebrow text-muted-foreground-strong">
                    {BMR_SUB[b]}
                  </span>
                )}
              </div>

              <div className="mt-intra flex items-baseline gap-intra">
                <span className="font-mono text-h2 tnum text-foreground">{fmtInt(total)}</span>
                <span className="text-meta text-muted-foreground-strong">
                  eps-passing {dir === "both" ? "pairs" : `${dir} pairs`}
                </span>
              </div>

              {top.length > 0 ? (
                <ol className="mt-caption space-y-intra">
                  {top.map((p) => {
                    const robust = nModels > 0 && p.rep === nModels;
                    return (
                      <li
                        key={`${p.type}:${p.key}`}
                        className="flex items-baseline gap-label text-meta"
                      >
                        <EdgeSwatch type={p.type} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate font-mono text-foreground">
                          {p.ga}
                          <span className="px-1 text-muted-foreground">·</span>
                          {p.gb}
                        </span>
                        <span className="shrink-0 font-mono text-meta tnum text-muted-foreground-strong">
                          {fmtRho(p.rho)}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 font-mono text-eyebrow tnum",
                            robust ? "text-brand" : "text-muted-foreground-stronger",
                          )}
                          title={`replicated in ${p.rep} of ${nModels} models`}
                        >
                          {p.rep}/{nModels}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-caption text-meta text-muted-foreground-strong">no pairs</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
