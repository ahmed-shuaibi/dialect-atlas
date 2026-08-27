import { EvidenceStatus, type EvidenceState } from "@/components/ui/evidence-status";
import {
  lrtLabel,
  modelState,
  stateLabel,
} from "@/features/atlas/components/pair/pair-evidence";
import { BMR_LABEL } from "@/features/atlas/lib/atlas-metadata";
import { fmtInt, fmtQ, fmtStat } from "@/features/atlas/lib/atlas-transform";
import type { Bmr, DialectRow, InteractionResult } from "@/features/atlas/types";
import { cn } from "@/lib/utils";

const EVIDENCE_STATE: Record<ReturnType<typeof modelState>, EvidenceState> = {
  significant: "supported",
  opposite: "warning",
  missing: "missing",
  "not-significant": "unsupported",
};

export function PairEvidenceCard({
  bmr,
  row,
  result,
  qThreshold,
}: {
  bmr: Bmr;
  row: DialectRow | undefined;
  result: InteractionResult;
  qThreshold: number;
}) {
  const state = modelState(row, result, qThreshold);
  const fallback = Boolean(
    bmr === "mutsig" && result.mutsigFallbackFeatures.length > 0 && row,
  );
  const effect = row?.direction === "ME"
    ? { label: "ρ", value: fmtStat(row.rho) }
    : row?.direction === "CO"
      ? { label: "LRT", value: lrtLabel(row) }
      : { label: "Effect", value: "not assigned" };
  const label = fallback
    ? `${stateLabel(state, row)}; CBaSE fallback, not independent`
    : stateLabel(state, row);

  return (
    <article className="rounded-2xl border border-line bg-paper px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-black">{BMR_LABEL[bmr]}</h4>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <EvidenceStatus state={fallback ? "warning" : EVIDENCE_STATE[state]} label={label} />
          <span
            className={cn(
              state === "significant" && !fallback && "text-support",
              state === "opposite" && "text-alert",
              (state === "missing" || state === "not-significant") && "text-muted",
              fallback && "text-alert",
            )}
          >
            {label}
          </span>
        </span>
      </div>
      {row ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <dt className="text-xs font-semibold text-muted">Direction</dt>
            <dd
              className={cn(
                "mt-0.5 text-sm font-semibold",
                row.direction === "ME" && "text-me",
                row.direction === "CO" && "text-co",
                row.direction === "neutral" && "text-muted",
              )}
            >
              {row.direction === "neutral" ? "Neutral" : row.direction}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted">q</dt>
            <dd className="mt-0.5 font-mono text-[13px] tabular-nums">{fmtQ(row.q)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted">{effect.label}</dt>
            <dd className="mt-0.5 font-mono text-[13px] tabular-nums">
              {effect.value}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted">Rank</dt>
            <dd className="mt-0.5 font-mono text-[13px] tabular-nums">
              {fmtInt(row.rank)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted">EM n</dt>
            <dd className="mt-0.5 font-mono text-[13px] tabular-nums">
              {fmtInt(row.effectiveN)}/{fmtInt(row.effectiveN + row.excludedSamples)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted">No result for this pair.</p>
      )}
      {fallback && (
        <p className="mt-2 text-xs font-bold text-alert">CBaSE fallback · not independent</p>
      )}
    </article>
  );
}
