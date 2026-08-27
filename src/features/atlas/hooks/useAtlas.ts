import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearAtlasCache,
  loadCohort,
  loadRelease,
} from "@/features/atlas/lib/atlas-data";
import type { CohortData, CohortMeta, ReleaseBundle } from "@/features/atlas/types";

type LoadState<T> = {
  data: T | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
};

const initial = <T,>(): LoadState<T> => ({ data: null, status: "loading", error: null });

export function useRelease() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState<ReleaseBundle>>(initial);

  useEffect(() => {
    let active = true;
    setState(initial());
    void loadRelease()
      .then((data) => {
        if (active) setState({ data, status: "ready", error: null });
      })
      .catch((error: unknown) => {
        if (active) setState({ data: null, status: "error", error: String(error) });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    clearAtlasCache();
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, retry };
}

export function useCohort(meta: CohortMeta | null) {
  const request = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState<CohortData>>({
    data: null,
    status: "idle",
    error: null,
  });

  useEffect(() => {
    const current = ++request.current;
    if (!meta) {
      setState({ data: null, status: "idle", error: null });
      return;
    }

    // Clear the prior cohort immediately: a fast selection must never show stale results.
    setState({ data: null, status: "loading", error: null });
    void loadCohort(meta)
      .then((data) => {
        if (request.current === current) setState({ data, status: "ready", error: null });
      })
      .catch((error: unknown) => {
        if (request.current === current) {
          setState({ data: null, status: "error", error: String(error) });
        }
      });
  }, [meta, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, retry };
}
