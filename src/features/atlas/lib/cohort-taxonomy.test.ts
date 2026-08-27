import { describe, expect, it } from "vitest";
import releaseIndex from "../../../../public/data/releases/k100-2026-08-26/index.json";
import {
  CANCER_FAMILIES,
  COHORT_FAMILY_BY_ID,
  TAXONOMY_COHORT_IDS,
  familyForCohort,
} from "@/features/atlas/lib/cohort-taxonomy";

describe("Atlas cancer-family taxonomy", () => {
  it("assigns every immutable K=100 cohort exactly once, with no extra ids", () => {
    const releaseIds = releaseIndex.cohorts.map((cohort) => cohort.id).sort();
    const taxonomyIds = [...TAXONOMY_COHORT_IDS].sort();

    expect(new Set(TAXONOMY_COHORT_IDS).size).toBe(TAXONOMY_COHORT_IDS.length);
    expect(taxonomyIds).toEqual(releaseIds);
    expect(TAXONOMY_COHORT_IDS).toHaveLength(71);
  });

  it("resolves explicit families without display-name inference", () => {
    expect(familyForCohort("TCGA__CHOL")?.label).toBe("Hepatobiliary");
    expect(familyForCohort("TCGA__LUAD")?.label).toBe("Lung");
    expect(familyForCohort("NOT_A_RELEASE_COHORT")).toBeNull();
    expect(Object.keys(COHORT_FAMILY_BY_ID)).toHaveLength(71);
    expect(CANCER_FAMILIES.length).toBeGreaterThan(10);
  });
});
