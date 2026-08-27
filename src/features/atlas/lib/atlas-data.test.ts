import { afterEach, describe, expect, it, vi } from "vitest";
import { clearAtlasCache, loadCohort } from "@/features/atlas/lib/atlas-data";
import type { CohortMeta } from "@/features/atlas/types";

const DIALECT_FIELDS = [
  "ga",
  "gb",
  "tau00",
  "tau10",
  "tau01",
  "tau11",
  "observed_both",
  "observed_b_only",
  "observed_a_only",
  "observed_neither",
  "tau1x",
  "taux1",
  "rho",
  "log_odds_ratio",
  "lrt",
  "wald",
  "p",
  "q",
  "direction",
  "rank",
  "tau_mass",
  "effective_n",
  "excluded_samples",
];
const BASELINE_FIELDS = [
  "ga",
  "gb",
  "fisher_me_p",
  "fisher_co_p",
  "fisher_me_q",
  "fisher_co_q",
  "discover_me_p",
  "discover_co_p",
  "discover_me_q",
  "discover_co_q",
  "megsa_lrt",
  "megsa_p",
  "megsa_q",
  "wesme_p",
  "wesco_p",
  "wesme_q",
  "wesco_q",
];

const payload = (id: string) => ({
  id,
  drivers: [],
  models: Object.fromEntries(
    ["cbase", "dig", "mutsig"].map((bmr) => [bmr, { fields: DIALECT_FIELDS, rows: [] }]),
  ),
  baselines: { fields: BASELINE_FIELDS, rows: [] },
  testing_universes: {
    models: { mutsig: { origins: { cbase_fallback: [] } } },
  },
});

const meta = (id: string): CohortMeta => ({
  id,
  study: "TCGA",
  cohort: id,
  cancer: id,
  n_samples: 1,
  median_mutations: 0,
  cbio: "",
  data_file: `cohorts/${id}.json`,
  data_sha256: "0".repeat(64),
  data_bytes: 1,
});

afterEach(() => {
  clearAtlasCache();
  vi.restoreAllMocks();
});

describe("loadCohort cache", () => {
  it("does not retain settled promises after a decoded cohort is evicted", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const id = String(input).match(/cohorts\/(.+)\.json$/)?.[1] ?? "missing";
      return new Response(JSON.stringify(payload(id)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    for (const id of ["A", "B", "C", "D"]) await loadCohort(meta(id));
    await loadCohort(meta("A"));

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
