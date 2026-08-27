import type { CohortMeta } from "@/features/atlas/types";

export interface CancerFamilyDefinition {
  id: string;
  label: string;
  description: string;
  cohortIds: readonly string[];
}

/**
 * Deliberate, release-specific taxonomy for the Atlas cohort picker.
 *
 * Cohort family is never inferred from a display name or identifier. Every
 * immutable K=100 cohort is assigned here and the release coverage test keeps
 * this list synchronized with the published index.
 */
export const CANCER_FAMILIES = [
  {
    id: "blood",
    label: "Blood",
    description: "Leukemia and lymphoma",
    cohortIds: ["TCGA__DLBC", "TCGA__LAML"],
  },
  {
    id: "bone-soft-tissue",
    label: "Bone & soft tissue",
    description: "Sarcoma and nerve-sheath tumors",
    cohortIds: [
      "MSK-IMPACT__Bone_Cancer",
      "MSK-IMPACT__Nerve_Sheath_Tumor",
      "MSK-IMPACT__Peripheral_Nervous_System",
      "MSK-IMPACT__Soft_Tissue_Sarcoma",
      "TCGA__SARC",
    ],
  },
  {
    id: "brain-cns",
    label: "Brain & CNS",
    description: "Glioma and central nervous system tumors",
    cohortIds: [
      "MSK-IMPACT__CNS_Cancer",
      "MSK-IMPACT__Glioma",
      "TCGA__GBM",
      "TCGA__LGG",
    ],
  },
  {
    id: "breast",
    label: "Breast",
    description: "Breast cancer cohorts",
    cohortIds: [
      "MSK-CHORD__Breast_Cancer",
      "MSK-IMPACT__Breast_Cancer",
      "TCGA__BRCA",
    ],
  },
  {
    id: "colorectal-intestinal",
    label: "Colorectal & intestinal",
    description: "Colorectal, anal, appendiceal and small-bowel tumors",
    cohortIds: [
      "MSK-CHORD__Colorectal_Cancer",
      "MSK-IMPACT__Anal_Cancer",
      "MSK-IMPACT__Appendiceal_Cancer",
      "MSK-IMPACT__Colorectal_Cancer",
      "MSK-IMPACT__Small_Bowel_Cancer",
      "TCGA__CRAD",
    ],
  },
  {
    id: "endocrine-adrenal",
    label: "Endocrine & adrenal",
    description: "Thyroid and adrenal-lineage tumors",
    cohortIds: [
      "MSK-IMPACT__Thyroid_Cancer",
      "TCGA__ACC",
      "TCGA__PCPG",
      "TCGA__THCA",
    ],
  },
  {
    id: "gynecologic",
    label: "Gynecologic",
    description: "Cervical, ovarian and uterine tumors",
    cohortIds: [
      "MSK-IMPACT__Cervical_Cancer",
      "MSK-IMPACT__Endometrial_Cancer",
      "MSK-IMPACT__Ovarian_Cancer",
      "MSK-IMPACT__Uterine_Sarcoma",
      "TCGA__CESC",
      "TCGA__OV",
      "TCGA__UCEC",
      "TCGA__UCS",
    ],
  },
  {
    id: "head-neck",
    label: "Head & neck",
    description: "Head, neck and salivary-gland tumors",
    cohortIds: [
      "MSK-IMPACT__Head_and_Neck_Cancer",
      "MSK-IMPACT__Salivary_Gland_Cancer",
      "TCGA__HNSC",
    ],
  },
  {
    id: "hepatobiliary",
    label: "Hepatobiliary",
    description: "Liver and bile-duct tumors",
    cohortIds: [
      "MSK-IMPACT__Hepatobiliary_Cancer",
      "TCGA__CHOL",
      "TCGA__LIHC",
    ],
  },
  {
    id: "kidney",
    label: "Kidney",
    description: "Renal-cell carcinoma cohorts",
    cohortIds: [
      "MSK-IMPACT__Renal_Cell_Carcinoma",
      "TCGA__KICH",
      "TCGA__KIRC",
      "TCGA__KIRP",
    ],
  },
  {
    id: "lung",
    label: "Lung",
    description: "Small-cell and non-small-cell lung cancer",
    cohortIds: [
      "MSK-CHORD__Non_Small_Cell_Lung_Cancer",
      "MSK-IMPACT__Non_Small_Cell_Lung_Cancer",
      "MSK-IMPACT__Small_Cell_Lung_Cancer",
      "TCGA__LUAD",
      "TCGA__LUSC",
    ],
  },
  {
    id: "melanoma-skin",
    label: "Melanoma & skin",
    description: "Cutaneous, non-melanoma and uveal tumors",
    cohortIds: [
      "MSK-IMPACT__Melanoma",
      "MSK-IMPACT__Skin_Cancer_Non_Melanoma",
      "TCGA__SKCM",
      "TCGA__UVM",
    ],
  },
  {
    id: "pancreatic-ampullary",
    label: "Pancreatic & ampullary",
    description: "Pancreatic and ampullary tumors",
    cohortIds: [
      "MSK-CHORD__Pancreatic_Cancer",
      "MSK-IMPACT__Ampullary_Cancer",
      "MSK-IMPACT__Pancreatic_Cancer",
      "TCGA__PAAD",
    ],
  },
  {
    id: "prostate",
    label: "Prostate",
    description: "Prostate cancer cohorts",
    cohortIds: [
      "MSK-CHORD__Prostate_Cancer",
      "MSK-IMPACT__Prostate_Cancer",
      "TCGA__PRAD",
    ],
  },
  {
    id: "testicular-germ-cell",
    label: "Testicular & germ cell",
    description: "Germ-cell tumor cohorts",
    cohortIds: ["MSK-IMPACT__Germ_Cell_Tumor", "TCGA__TGCT"],
  },
  {
    id: "thoracic-mesothelial",
    label: "Thoracic & mesothelial",
    description: "Mesothelioma and thymic tumors",
    cohortIds: [
      "MSK-IMPACT__Mesothelioma",
      "TCGA__MESO",
      "TCGA__THYM",
    ],
  },
  {
    id: "upper-gastrointestinal",
    label: "Upper gastrointestinal",
    description: "Esophageal, gastric, stromal and neuroendocrine tumors",
    cohortIds: [
      "MSK-IMPACT__Esophagogastric_Cancer",
      "MSK-IMPACT__Gastrointestinal_Neuroendocrine_Tumor",
      "MSK-IMPACT__Gastrointestinal_Stromal_Tumor",
      "TCGA__ESCA",
      "TCGA__STAD",
    ],
  },
  {
    id: "urinary-bladder",
    label: "Urinary bladder",
    description: "Bladder cancer cohorts",
    cohortIds: ["MSK-IMPACT__Bladder_Cancer", "TCGA__BLCA"],
  },
  {
    id: "unknown-primary",
    label: "Unknown primary",
    description: "Cancer of unknown primary",
    cohortIds: ["MSK-IMPACT__Cancer_of_Unknown_Primary"],
  },
] as const satisfies readonly CancerFamilyDefinition[];

export type CancerFamilyId = (typeof CANCER_FAMILIES)[number]["id"];

export const TAXONOMY_COHORT_IDS = CANCER_FAMILIES.flatMap((family) =>
  [...family.cohortIds],
);

const familyById = new Map<CancerFamilyId, (typeof CANCER_FAMILIES)[number]>(
  CANCER_FAMILIES.map((family) => [family.id, family]),
);

const cohortFamilyEntries = CANCER_FAMILIES.flatMap((family) =>
  family.cohortIds.map((cohortId) => [cohortId, family.id] as const),
);

if (new Set(TAXONOMY_COHORT_IDS).size !== TAXONOMY_COHORT_IDS.length) {
  throw new Error("The Atlas cancer-family taxonomy contains a duplicate cohort id.");
}

export const COHORT_FAMILY_BY_ID = Object.freeze(
  Object.fromEntries(cohortFamilyEntries),
) as Readonly<Record<string, CancerFamilyId>>;

export function familyForCohort(
  cohortId: string,
): (typeof CANCER_FAMILIES)[number] | null {
  const familyId = COHORT_FAMILY_BY_ID[cohortId];
  return familyId ? familyById.get(familyId) ?? null : null;
}

export function cohortsForFamily(
  cohorts: readonly CohortMeta[],
  familyId: CancerFamilyId,
): CohortMeta[] {
  const family = familyById.get(familyId);
  if (!family) return [];
  const byId = new Map(cohorts.map((cohort) => [cohort.id, cohort]));
  return family.cohortIds.flatMap((cohortId) => {
    const cohort = byId.get(cohortId);
    return cohort ? [cohort] : [];
  });
}
