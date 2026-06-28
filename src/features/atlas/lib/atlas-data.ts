import type {
  Atlas,
  AtlasIndex,
  Cohort,
  CohortMeta,
  CohortShard,
} from "@/features/atlas/types";

/** Resolve a data path under the production base ("/dialect-atlas/" on GitHub Pages). */
const dataUrl = (rel: string) => `${import.meta.env.BASE_URL}data/atlas/${rel}`;

/**
 * Load the small up-front index (cohort meta + per-bmr ME/CO counts, <30KB). Cohorts come back as
 * lightweight `CohortMeta` (no edges/drivers); the counts the index carries (n_total) are enough
 * for the combobox, Show-option counts, the cross-model strip totals, and empty-state recovery.
 * Each cohort's heavy shard is hydrated to a full `Cohort` on demand via `loadCohort`.
 */
export async function loadAtlas(signal?: AbortSignal): Promise<Atlas> {
  const res = await fetch(dataUrl("index.json"), { signal });
  if (!res.ok) throw new Error(`failed to load atlas index (${res.status})`);
  const idx: AtlasIndex = await res.json();
  return {
    bmrs: idx.bmrs,
    bmr_label: idx.bmr_label,
    cohorts: idx.cohorts,
  };
}

/**
 * Fetch one cohort's heavy shard (drivers + full per-bmr ME/CO edges) and hydrate the index-level
 * `CohortMeta` into a full `Cohort`. Returns a new object so React sees a fresh reference. The
 * caller keys hydration by cohort id and guards with an AbortSignal.
 */
export async function loadCohort(meta: CohortMeta, signal?: AbortSignal): Promise<Cohort> {
  const res = await fetch(dataUrl(`cohort/${meta.id}.json`), { signal });
  if (!res.ok) throw new Error(`failed to load cohort ${meta.id} (${res.status})`);
  const shard: CohortShard = await res.json();
  return { ...meta, drivers: shard.drivers, bmrs: shard.bmrs };
}
