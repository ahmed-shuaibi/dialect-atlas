import {
  fmtStat,
  isSignificant,
  lrtEvidence,
} from "@/features/atlas/lib/atlas-transform";
import type { DialectRow, InteractionResult } from "@/features/atlas/types";

export type PairModelState =
  | "significant"
  | "opposite"
  | "not-significant"
  | "unavailable"
  | "missing";

export function lrtLabel(row: DialectRow): string {
  return row.lrt < 0
    ? `0.00 (raw ${fmtStat(row.lrt, 3)})`
    : fmtStat(lrtEvidence(row), 2);
}

export function modelState(
  row: DialectRow | undefined,
  result: InteractionResult,
  qThreshold: number,
): PairModelState {
  if (!row) return "missing";
  if (isSignificant(row, qThreshold) && (row.direction === "ME" || row.direction === "CO")) {
    return row.direction === result.direction ? "significant" : "opposite";
  }
  if (isSignificant(row, qThreshold) && row.direction === "unavailable") return "unavailable";
  return "not-significant";
}

export function stateLabel(
  state: PairModelState,
  row: DialectRow | undefined,
): string {
  if (state === "significant") return "Significant";
  if (state === "opposite") {
    return `Significant ${row?.direction ?? "opposite"}; opposite direction`;
  }
  if (state === "not-significant") return "Not significant";
  if (state === "unavailable") return "Rejected; direction unavailable";
  return "Not tested";
}
