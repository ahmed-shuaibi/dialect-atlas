import { useEffect, useState } from "react";
import { loadAtlas, loadCohort } from "@/features/atlas/lib/atlas-data";
import type { Atlas, Cohort, CohortMeta } from "@/features/atlas/types";

export interface UseAtlas {
  atlas: Atlas | null;
  error: string | null;
}

/** Index-load lifecycle (error / data) with an abort guard on unmount. */
export function useAtlas(): UseAtlas {
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    loadAtlas(ctrl.signal)
      .then((a) => {
        if (!ctrl.signal.aborted) setAtlas(a);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(String(e));
      });
    return () => ctrl.abort();
  }, []);

  return { atlas, error };
}

export interface UseCohort {
  /** The hydrated cohort (full edges + drivers), or null until the shard arrives. */
  cohort: Cohort | null;
  error: string | null;
}

/**
 * Lazily hydrate one cohort's heavy shard on demand. `meta` is the index-level cohort (meta +
 * counts) whose id selects the shard; re-fetches whenever the id changes, with an abort guard so
 * a fast cohort switch never lands a stale shard. Re-uses the already-hydrated cohort when its id
 * matches, so flipping BMR / direction / passenger filter never re-fetches.
 */
export function useCohort(meta: CohortMeta | null): UseCohort {
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [error, setError] = useState<string | null>(null);

  const id = meta?.id ?? null;

  useEffect(() => {
    if (!meta) {
      setCohort(null);
      return;
    }
    // already hydrated (edges present) → reuse synchronously, no fetch
    if (cohort?.id === meta.id && cohort.drivers.length > 0) return;

    const ctrl = new AbortController();
    setError(null);
    loadCohort(meta, ctrl.signal)
      .then((c) => {
        if (!ctrl.signal.aborted) setCohort(c);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(String(e));
      });
    return () => ctrl.abort();
    // keyed by id only: BMR/direction/filter changes keep the same hydrated cohort.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { cohort, error };
}
