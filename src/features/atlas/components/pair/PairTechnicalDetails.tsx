import { ExternalLink } from "lucide-react";
import { ATLAS_LINKS, BMR_LABEL } from "@/features/atlas/lib/atlas-metadata";
import { fmtInt, fmtStat } from "@/features/atlas/lib/atlas-transform";
import { BMR_IDS, type Bmr, type DialectRow } from "@/features/atlas/types";

export function PairTechnicalDetails({
  evidenceByModel,
  mutsigFallbackFeatures,
}: {
  evidenceByModel: Record<Bmr, DialectRow | undefined>;
  mutsigFallbackFeatures: string[];
}) {
  return (
    <details className="mt-6 border-t border-line pt-4">
      <summary className="focus-ring cursor-pointer rounded-full text-sm font-semibold">
        Technical details
      </summary>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {BMR_IDS.map((bmr) => {
          const row = evidenceByModel[bmr];
          if (!row) {
            return (
              <div key={bmr} className="rounded-2xl border border-line p-3 text-sm text-muted">
                <p className="font-bold text-ink">{BMR_LABEL[bmr]}</p>
                <p className="mt-2">Not tested.</p>
              </div>
            );
          }
          const fallback = bmr === "mutsig" && mutsigFallbackFeatures.length > 0;
          return (
            <div key={bmr} className="rounded-2xl border border-line p-3">
              <p className="text-xs font-black">{BMR_LABEL[bmr]}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs tabular-nums">
                <div><dt className="inline text-muted">τ₀₀ </dt><dd className="inline">{fmtStat(row.tau00)}</dd></div>
                <div><dt className="inline text-muted">τ₁₀ </dt><dd className="inline">{fmtStat(row.tau10)}</dd></div>
                <div><dt className="inline text-muted">τ₀₁ </dt><dd className="inline">{fmtStat(row.tau01)}</dd></div>
                <div><dt className="inline text-muted">τ₁₁ </dt><dd className="inline">{fmtStat(row.tau11)}</dd></div>
                <div className="col-span-2"><dt className="inline text-muted">Excluded </dt><dd className="inline">{fmtInt(row.excludedSamples)}</dd></div>
              </dl>
              {fallback && (
                <p className="mt-2 text-xs font-bold leading-5 text-alert">
                  MutSigCV2 reuses CBaSE for {mutsigFallbackFeatures.join(" and ")}; it is not independent background evidence.
                </p>
              )}
              {row.excludedSamples > 0 && (
                <p className="mt-2 text-xs leading-5 text-muted">
                  Samples without background support contribute no posterior mass.
                </p>
              )}
            </div>
          );
        })}
      </div>
      <a
        href={ATLAS_LINKS.paper}
        target="_blank"
        rel="noreferrer"
        className="focus-ring mt-4 inline-flex items-center gap-2 text-xs font-bold underline decoration-line underline-offset-4 hover:decoration-ink"
      >
        DIALECT method
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </details>
  );
}
