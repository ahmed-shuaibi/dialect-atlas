import { ExternalLink } from "lucide-react";
import { Badge, DirectionBadge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  BMR_LABEL,
  baseGene,
  fmtInt,
  fmtQ,
  fmtStat,
  lrtEvidence,
} from "@/features/atlas/lib/atlas-transform";
import { BMR_IDS, type AtlasMode, type Bmr, type CohortData, type DialectRow, type InteractionResult } from "@/features/atlas/types";
import { cn } from "@/lib/utils";

function lrtLabel(row: DialectRow): string {
  if (row.lrt < 0) return `0.00 · clamped from ${fmtStat(row.lrt, 3)}`;
  return fmtStat(lrtEvidence(row), 2);
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-sand px-4 py-3">
      <p className="eyebrow">{label}</p>
      <p className={cn("mt-2 font-mono text-sm font-semibold", accent)}>{value}</p>
    </div>
  );
}

export function PairDialog({
  result,
  data,
  mode,
  open,
  onOpenChange,
}: {
  result: InteractionResult | null;
  data: CohortData;
  mode: AtlasMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!result) return null;
  const activeBmr: Bmr = mode === "consensus" ? "cbase" : mode;
  const active = result.matches.find((match) => match.bmr === activeBmr)?.row;
  if (!active) return null;
  const reversed = active.ga === result.gb && active.gb === result.ga;
  const observedAOnly = reversed ? active.observedBOnly : active.observedAOnly;
  const observedBOnly = reversed ? active.observedAOnly : active.observedBOnly;
  const geneAIsDriver = data.drivers.includes(baseGene(result.ga));
  const geneBIsDriver = data.drivers.includes(baseGene(result.gb));
  const mutsigFallback = result.mutsigFallbackFeatures;
  const me = result.direction === "ME";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="pr-12">
          <DirectionBadge direction={result.direction} />
          <DialogTitle className="mt-5 break-words font-mono text-[clamp(1.7rem,5vw,2.7rem)]">
            {result.ga} <span className="text-muted">/</span> {result.gb}
          </DialogTitle>
          <DialogDescription className="mt-3 max-w-2xl text-base leading-7">
            These inferred gene-effect states occur {me ? "less" : "more"} often together than expected under the no-interaction model.
          </DialogDescription>
          <p className="mt-3 text-sm font-semibold leading-6">
            This {result.direction} direction was inferred in {result.matches.length}/3 BMR outputs; FDR-supported at q &lt; 0.01 in {result.fdrSupport}/3.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {geneAIsDriver && <Badge>{baseGene(result.ga)} · OncoKB-listed cancer gene</Badge>}
            {geneBIsDriver && <Badge>{baseGene(result.gb)} · OncoKB-listed cancer gene</Badge>}
            <Badge>FDR support {result.fdrSupport}/3</Badge>
            {mutsigFallback.length > 0 && <Badge>MutSig uses CBaSE fallback</Badge>}
          </div>
          {mutsigFallback.length > 0 && (
            <p className="mt-3 rounded-2xl border border-alert/20 bg-alert/5 px-4 py-3 text-xs font-semibold leading-5 text-muted">
              MutSigCV2 has no per-sample lambda for {mutsigFallback.join(" and ")}; its result reuses the CBaSE background. This pair is excluded from three-background consensus.
            </p>
          )}
        </div>

        <section aria-labelledby="model-evidence-heading" className="mt-8">
          <h3 id="model-evidence-heading" className="text-lg font-black tracking-tight">Across background models</h3>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
              <thead className="bg-sand/70 text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">Model</th>
                  <th className="px-4 py-3 font-bold">Direction</th>
                  <th className="px-4 py-3 font-bold">ρ</th>
                  <th className="px-4 py-3 font-bold">LRT</th>
                  <th className="px-4 py-3 font-bold">q</th>
                  <th className="px-4 py-3 font-bold">Rank</th>
                  <th className="px-4 py-3 font-bold">EM n</th>
                </tr>
              </thead>
              <tbody>
                {BMR_IDS.map((bmr) => {
                  const evidence = result.pairEvidence.find((item) => item.bmr === bmr);
                  return (
                    <tr key={bmr} className="border-t border-line">
                      <th className="px-4 py-3 font-bold">
                        {BMR_LABEL[bmr]}
                        {bmr === "mutsig" && mutsigFallback.length > 0 && (
                          <span className="mt-1 block text-[10px] text-alert">CBaSE fallback</span>
                        )}
                      </th>
                      {evidence ? (
                        <>
                          <td className="px-4 py-3 font-bold">
                            <span className={cn(
                              evidence.row.direction === "ME" && "text-me",
                              evidence.row.direction === "CO" && "text-co",
                              evidence.row.direction === "neutral" && "text-muted",
                            )}>
                              {evidence.row.direction === "neutral" ? "Neutral" : evidence.row.direction}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono">{fmtStat(evidence.row.rho)}</td>
                          <td className="px-4 py-3 font-mono">{lrtLabel(evidence.row)}</td>
                          <td className={cn("px-4 py-3 font-mono", evidence.row.q != null && evidence.row.q < 0.01 && "font-bold text-support")}>
                            {fmtQ(evidence.row.q)}
                          </td>
                          <td className="px-4 py-3 font-mono">{fmtInt(evidence.row.rank)}</td>
                          <td className="px-4 py-3 font-mono">
                            {fmtInt(evidence.row.effectiveN)}/
                            {fmtInt(evidence.row.effectiveN + evidence.row.excludedSamples)}
                          </td>
                        </>
                      ) : (
                        <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-muted">Not tested for this pair</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="active-model-heading" className="mt-8">
          <div className="flex items-baseline justify-between gap-4">
            <h3 id="active-model-heading" className="text-lg font-black tracking-tight">
              {BMR_LABEL[activeBmr]} detail
            </h3>
            {mode === "consensus" && <span className="text-xs font-semibold text-muted">representative view</span>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="ρ" value={fmtStat(active.rho)} accent={me ? "text-me" : "text-co"} />
            <Stat label="LRT evidence" value={lrtLabel(active)} />
            <Stat label="Raw fitted τ₁₁ mass" value={fmtStat(active.tau11)} />
            <Stat label="q" value={fmtQ(active.q)} accent={active.q != null && active.q < 0.01 ? "text-support" : undefined} />
          </div>
          {active.excludedSamples > 0 && (
            <p className="mt-3 rounded-2xl border border-alert/20 bg-alert/5 px-4 py-3 text-xs font-semibold leading-5 text-muted">
              {fmtInt(active.excludedSamples)} sample{active.excludedSamples === 1 ? "" : "s"} had no background support and contributed no posterior mass to this fit. Raw τ values are not renormalized and may be biased.
            </p>
          )}
        </section>

        <section aria-labelledby="observed-heading" className="mt-8">
          <h3 id="observed-heading" className="text-lg font-black tracking-tight">Observed tumors</h3>
          <p className="mt-1 text-xs leading-5 text-muted">Raw mutation-status counts; these are not latent driver probabilities.</p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead className="bg-sand/70 text-xs text-muted">
                <tr>
                  <td className="px-3 py-2" />
                  <th className="px-3 py-2 text-right font-bold">{result.gb} mutated</th>
                  <th className="px-3 py-2 text-right font-bold">{result.gb} not mutated</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line">
                  <th className="px-3 py-3 text-left text-xs font-bold">{result.ga} mutated</th>
                  <td className="bg-sand px-3 py-3 text-right font-mono font-bold">{fmtInt(active.observedBoth)}</td>
                  <td className="px-3 py-3 text-right font-mono">{fmtInt(observedAOnly)}</td>
                </tr>
                <tr className="border-t border-line">
                  <th className="px-3 py-3 text-left text-xs font-bold">{result.ga} not mutated</th>
                  <td className="px-3 py-3 text-right font-mono">{fmtInt(observedBOnly)}</td>
                  <td className="px-3 py-3 text-right font-mono">{fmtInt(active.observedNeither)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <a
          href="https://github.com/raphael-group/dialect"
          target="_blank"
          rel="noreferrer"
          className="focus-ring mt-8 inline-flex items-center gap-2 rounded-full text-sm font-bold underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          DIALECT method
          <ExternalLink className="size-4" aria-hidden />
        </a>
      </DialogContent>
    </Dialog>
  );
}
