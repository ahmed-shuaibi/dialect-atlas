import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BMR_LABEL,
  fmtInt,
  fmtQ,
  fmtStat,
  lrtEvidence,
} from "@/features/atlas/lib/atlas-transform";
import {
  BMR_IDS,
  type AtlasMode,
  type Bmr,
  type CohortData,
  type DialectRow,
  type InteractionResult,
} from "@/features/atlas/types";
import { cn } from "@/lib/utils";

function lrtLabel(row: DialectRow): string {
  if (row.lrt < 0) return `0.00 (raw ${fmtStat(row.lrt, 3)})`;
  return fmtStat(lrtEvidence(row), 2);
}

function modelState(row: DialectRow | undefined, result: InteractionResult) {
  if (!row) return "missing" as const;
  if (row.q != null && row.q < 0.01 && (row.direction === "ME" || row.direction === "CO")) {
    return row.direction === result.direction
      ? ("significant" as const)
      : ("opposite" as const);
  }
  return "not-significant" as const;
}

function stateLabel(
  state: ReturnType<typeof modelState>,
  row: DialectRow | undefined,
): string {
  if (state === "significant") return "Significant";
  if (state === "opposite") return `Significant ${row?.direction ?? "opposite"}; opposite direction`;
  if (state === "not-significant") return "Not significant";
  return "Not tested";
}

function EvidenceRow({
  bmr,
  row,
  result,
}: {
  bmr: Bmr;
  row: DialectRow | undefined;
  result: InteractionResult;
}) {
  const state = modelState(row, result);
  const effectLabel = result.direction === "ME" ? "ρ" : "LRT";
  const fallback = bmr === "mutsig" && result.mutsigFallbackFeatures.length > 0 && row;
  return (
    <article className="border border-line bg-paper px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-black">{BMR_LABEL[bmr]}</h4>
        <span
          className={cn(
            "text-[11px] font-bold",
            state === "significant"
              ? "text-support"
              : state === "opposite"
                ? "text-alert"
                : "text-muted",
          )}
        >
          <span aria-hidden>{state === "significant" ? "✓" : state === "opposite" ? "△" : state === "missing" ? "—" : "○"}</span>{" "}
          {stateLabel(state, row)}
        </span>
      </div>
      {row ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
          <div>
            <dt className="text-[10px] font-bold text-muted">Direction</dt>
            <dd
              className={cn(
                "mt-0.5 text-xs font-black",
                row.direction === "ME" && "text-me",
                row.direction === "CO" && "text-co",
                row.direction === "neutral" && "text-muted",
              )}
            >
              {row.direction === "neutral" ? "Neutral" : row.direction}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold text-muted">q</dt>
            <dd className="mt-0.5 font-mono text-xs tabular-nums">{fmtQ(row.q)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold text-muted">{effectLabel}</dt>
            <dd className="mt-0.5 font-mono text-xs tabular-nums">
              {result.direction === "ME" ? fmtStat(row.rho) : lrtLabel(row)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold text-muted">Rank</dt>
            <dd className="mt-0.5 font-mono text-xs tabular-nums">{fmtInt(row.rank)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold text-muted">EM n</dt>
            <dd className="mt-0.5 font-mono text-xs tabular-nums">
              {fmtInt(row.effectiveN)}/{fmtInt(row.effectiveN + row.excludedSamples)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-xs text-muted">No result for this pair.</p>
      )}
      {fallback && (
        <p className="mt-2 text-[10px] font-bold text-alert">CBaSE fallback</p>
      )}
    </article>
  );
}

function heatClass(value: number, maximum: number): string {
  const share = maximum > 0 ? value / maximum : 0;
  if (share > 0.72) return "bg-ink text-paper";
  if (share > 0.35) return "bg-muted/30 text-ink";
  if (share > 0.1) return "bg-sand-deep text-ink";
  if (share > 0) return "bg-sand text-ink";
  return "bg-paper text-muted";
}

function ObservedMatrix({ row, result }: { row: DialectRow; result: InteractionResult }) {
  const values = [
    row.observedBoth,
    row.observedAOnly,
    row.observedBOnly,
    row.observedNeither,
  ];
  const maximum = Math.max(...values);
  const cells = [
    { label: `${result.ga} mutated, ${result.gb} mutated`, value: row.observedBoth },
    { label: `${result.ga} mutated, ${result.gb} not mutated`, value: row.observedAOnly },
    { label: `${result.ga} not mutated, ${result.gb} mutated`, value: row.observedBOnly },
    { label: `${result.ga} not mutated, ${result.gb} not mutated`, value: row.observedNeither },
  ];
  return (
    <div className="grid grid-cols-[auto_repeat(2,minmax(0,1fr))] items-stretch gap-1 text-[10px]">
      <span />
      <span className="self-end px-1 pb-1 text-center font-bold leading-tight">{result.gb} +</span>
      <span className="self-end px-1 pb-1 text-center font-bold leading-tight">{result.gb} −</span>
      <span className="flex items-center pr-2 text-right font-bold leading-tight">{result.ga} +</span>
      {cells.slice(0, 2).map((cell) => (
        <div
          key={cell.label}
          className={cn(
            "grid min-h-14 place-items-center px-2 py-3 font-mono text-sm font-bold tabular-nums",
            heatClass(cell.value, maximum),
          )}
          aria-label={`${cell.label}: ${fmtInt(cell.value)} tumors`}
        >
          {fmtInt(cell.value)}
        </div>
      ))}
      <span className="flex items-center pr-2 text-right font-bold leading-tight">{result.ga} −</span>
      {cells.slice(2).map((cell) => (
        <div
          key={cell.label}
          className={cn(
            "grid min-h-14 place-items-center px-2 py-3 font-mono text-sm font-bold tabular-nums",
            heatClass(cell.value, maximum),
          )}
          aria-label={`${cell.label}: ${fmtInt(cell.value)} tumors`}
        >
          {fmtInt(cell.value)}
        </div>
      ))}
    </div>
  );
}

export type PairDialogProps = {
  result: InteractionResult | null;
  data: CohortData;
  mode: AtlasMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PairDialog(props: PairDialogProps) {
  const { result, mode, open, onOpenChange } = props;
  if (!result) return null;
  const evidenceByModel = Object.fromEntries(
    BMR_IDS.map((bmr) => [
      bmr,
      result.pairEvidence.find((item) => item.bmr === bmr)?.row,
    ]),
  ) as Record<Bmr, DialectRow | undefined>;
  const directionAgreement = BMR_IDS.filter(
    (bmr) => evidenceByModel[bmr]?.direction === result.direction,
  ).length;
  const significantSupport = BMR_IDS.filter(
    (bmr) => modelState(evidenceByModel[bmr], result) === "significant",
  ).length;
  const allThreeSignificant =
    significantSupport === BMR_IDS.length && result.mutsigFallbackFeatures.length === 0;
  const selectedRow = mode === "consensus" ? undefined : evidenceByModel[mode];
  const selectedState = mode === "consensus" ? undefined : modelState(selectedRow, result);
  const selectedFallback =
    mode === "mutsig" &&
    selectedRow != null &&
    result.mutsigFallbackFeatures.length > 0;
  const lead =
    mode === "consensus"
      ? allThreeSignificant
        ? "Significant under all 3 backgrounds"
        : significantSupport === BMR_IDS.length && result.mutsigFallbackFeatures.length > 0
          ? "Not supported by 3 distinct backgrounds"
          : "Not significant under all 3 backgrounds"
      : selectedState === "significant"
        ? selectedFallback
          ? "Significant in MutSigCV2 view (CBaSE fallback)"
          : `Significant with ${BMR_LABEL[mode]}`
        : selectedState === "opposite"
          ? `Significant ${selectedRow?.direction ?? "opposite"} with ${BMR_LABEL[mode]}; opposite to ${result.direction}`
        : selectedState === "missing"
          ? `Not tested with ${BMR_LABEL[mode]}`
          : `Not significant with ${BMR_LABEL[mode]}`;
  const active =
    (mode !== "consensus" ? selectedRow : evidenceByModel.cbase) ??
    evidenceByModel.cbase ??
    result.pairEvidence[0]?.row;
  if (!active) return null;
  const me = result.direction === "ME";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="wide">
        <header className="pr-12">
          <p className={cn("text-xs font-black", me ? "text-me" : "text-co")}>
            {me ? "Mutually exclusive" : "Co-occurring"}
          </p>
          <DialogTitle className="mt-2 break-words font-mono text-[clamp(1.45rem,4vw,2.35rem)] leading-tight">
            {result.ga} <span className="text-muted">/</span> {result.gb}
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-3xl text-sm leading-6">
            These inferred gene-effect states occur {me ? "less" : "more"} often together than expected.
          </DialogDescription>
          <p className="mt-3 text-base font-black">{lead}</p>
          <p className="mt-1 text-xs font-semibold text-muted">
            {directionAgreement}/3 backgrounds agree on {result.direction}; {significantSupport}/3 meet q &lt; 0.01 in that direction.
          </p>
          {result.mutsigFallbackFeatures.length > 0 && (
            <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-alert">
              MutSigCV2 reuses the CBaSE background for {result.mutsigFallbackFeatures.join(" and ")}; that row does not count as distinct three-background support.
            </p>
          )}
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(15rem,0.7fr)]">
          <section aria-labelledby="model-evidence-heading">
            <h3 id="model-evidence-heading" className="text-sm font-black">Background evidence</h3>
            <div className="mt-3 space-y-2">
              {BMR_IDS.map((bmr) => (
                <EvidenceRow
                  key={bmr}
                  bmr={bmr}
                  row={evidenceByModel[bmr]}
                  result={result}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="observed-heading">
            <h3 id="observed-heading" className="text-sm font-black">Observed tumors</h3>
            <p className="mt-1 text-[10px] leading-4 text-muted">Mutation counts, not latent probabilities.</p>
            <div className="mt-3">
              <ObservedMatrix row={active} result={result} />
            </div>
          </section>
        </div>

        <details className="mt-6 border-t border-line pt-4">
          <summary className="focus-ring cursor-pointer text-xs font-black">Technical details</summary>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {BMR_IDS.map((bmr) => {
              const row = evidenceByModel[bmr];
              if (!row) {
                return (
                  <div key={bmr} className="border border-line p-3 text-xs text-muted">
                    <p className="font-bold text-ink">{BMR_LABEL[bmr]}</p>
                    <p className="mt-2">Not tested.</p>
                  </div>
                );
              }
              const fallback =
                bmr === "mutsig" && result.mutsigFallbackFeatures.length > 0;
              return (
                <div key={bmr} className="border border-line p-3">
                  <p className="text-xs font-black">{BMR_LABEL[bmr]}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] tabular-nums">
                    <div><dt className="inline text-muted">τ₀₀ </dt><dd className="inline">{fmtStat(row.tau00)}</dd></div>
                    <div><dt className="inline text-muted">τ₁₀ </dt><dd className="inline">{fmtStat(row.tau10)}</dd></div>
                    <div><dt className="inline text-muted">τ₀₁ </dt><dd className="inline">{fmtStat(row.tau01)}</dd></div>
                    <div><dt className="inline text-muted">τ₁₁ </dt><dd className="inline">{fmtStat(row.tau11)}</dd></div>
                    <div className="col-span-2"><dt className="inline text-muted">Excluded </dt><dd className="inline">{fmtInt(row.excludedSamples)}</dd></div>
                  </dl>
                  {fallback && (
                    <p className="mt-2 text-[10px] font-bold leading-4 text-alert">
                      MutSigCV2 reuses CBaSE for {result.mutsigFallbackFeatures.join(" and ")}; it is not independent background evidence.
                    </p>
                  )}
                  {row.excludedSamples > 0 && (
                    <p className="mt-2 text-[10px] leading-4 text-muted">
                      Samples without background support contribute no posterior mass.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <a
            href="https://github.com/raphael-group/dialect"
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-4 inline-flex items-center gap-2 text-xs font-bold underline decoration-line underline-offset-4 hover:decoration-ink"
          >
            DIALECT method
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </details>
      </DialogContent>
    </Dialog>
  );
}
