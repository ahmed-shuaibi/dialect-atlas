import { fmtStat, lrtEvidence } from "@/features/atlas/lib/atlas-transform";
import type { AtlasMode, InteractionResult } from "@/features/atlas/types";

export const NETWORK_PER_DIRECTION_LIMIT = 10;

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
 * Cap each direction independently so a sparse lane never makes the other lane
 * dominate the graph. Directional arrays already follow DIALECT's ranking rule.
 */
export function resultsForNetwork(
  results: InteractionResult[],
  perDirection = NETWORK_PER_DIRECTION_LIMIT,
): InteractionResult[] {
  if (perDirection <= 0) return [];
  return [
    ...results.filter(({ direction }) => direction === "ME").slice(0, perDirection),
    ...results.filter(({ direction }) => direction === "CO").slice(0, perDirection),
  ];
}
