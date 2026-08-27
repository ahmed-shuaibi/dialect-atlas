import { fmtStat, lrtEvidence } from "@/features/atlas/lib/atlas-transform";
import type { AtlasMode, InteractionResult } from "@/features/atlas/types";

export const NETWORK_RESULT_LIMIT = 24;

function median(values: number[]): number {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)] ?? 0;
}

export function resultEffect(result: InteractionResult, mode: AtlasMode): number {
  if (mode !== "consensus") {
    const row = result.matches.find(({ bmr }) => bmr === mode)?.row ?? result.representative;
    return result.direction === "ME" ? row.rho : lrtEvidence(row);
  }
  return median(
    result.matches.map(({ row }) =>
      result.direction === "ME" ? row.rho : lrtEvidence(row),
    ),
  );
}

export function resultEffectText(result: InteractionResult, mode: AtlasMode): string {
  const value = resultEffect(result, mode);
  const prefix = mode === "consensus" ? "median " : "";
  return result.direction === "ME"
    ? `${prefix}ρ ${value < 0 ? "−" : ""}${fmtStat(Math.abs(value))}`
    : `${prefix}LRT ${fmtStat(value, 2)}`;
}

/**
 * Keep dense networks legible without changing the underlying Explore result set.
 * When both directions are present, reserve half the visual budget for each and
 * give any unused slots to the other direction. Directional arrays are already
 * ordered by their DIALECT ranking rule.
 */
export function resultsForNetwork(
  results: InteractionResult[],
  limit = NETWORK_RESULT_LIMIT,
): InteractionResult[] {
  if (limit <= 0) return [];
  if (results.length <= limit) return results;

  const me = results.filter(({ direction }) => direction === "ME");
  const co = results.filter(({ direction }) => direction === "CO");
  if (me.length === 0 || co.length === 0) return results.slice(0, limit);

  const meBudget = Math.ceil(limit / 2);
  const coBudget = Math.floor(limit / 2);
  const selectedMe = me.slice(0, meBudget);
  const selectedCo = co.slice(0, coBudget);
  let remaining = limit - selectedMe.length - selectedCo.length;
  if (remaining > 0) {
    const meRemainder = me.slice(selectedMe.length, selectedMe.length + remaining);
    selectedMe.push(...meRemainder);
    remaining -= meRemainder.length;
  }
  if (remaining > 0) {
    selectedCo.push(...co.slice(selectedCo.length, selectedCo.length + remaining));
  }
  return [...selectedMe, ...selectedCo];
}
