/**
 * Fail-closed validation for the complete immutable DIALECT Atlas K=100 release.
 *
 * This runs with Node alone so the exact committed data contract can be gated in the
 * Atlas repository and on static-hosting builds without the Python analysis environment.
 */

import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath, URL } from "node:url";

const RELEASE_ID = "k100-2026-08-26";
const LIKELY_PASSENGER_FILE = "annotations/likely-passengers-v1.json";
const LIKELY_PASSENGER_SHA256 =
  "c8efd1f97359669ff21146e9ebcb61eaa6c109a1e22688beda291666c24e6cc2";
const ONCOKB_REFERENCE_SHA256 =
  "56cea460e396451395738dbb8dbda5f5a8fe6fb146dde18c902c8b6bd6034193";
const BASELINE_RELEASE_ID = "dialect-atlas-baselines-k100";
const BASELINE_SCHEMA_VERSION = "1.0";
const BASELINE_RELEASE_SEED = 20260826;
const EXPECTED_STUDIES = { "MSK-CHORD": 5, "MSK-IMPACT": 34, TCGA: 32 };
const EXPECTED_COHORT_IDS = [
  "MSK-CHORD__Breast_Cancer",
  "MSK-CHORD__Colorectal_Cancer",
  "MSK-CHORD__Non_Small_Cell_Lung_Cancer",
  "MSK-CHORD__Pancreatic_Cancer",
  "MSK-CHORD__Prostate_Cancer",
  "MSK-IMPACT__Ampullary_Cancer",
  "MSK-IMPACT__Anal_Cancer",
  "MSK-IMPACT__Appendiceal_Cancer",
  "MSK-IMPACT__Bladder_Cancer",
  "MSK-IMPACT__Bone_Cancer",
  "MSK-IMPACT__Breast_Cancer",
  "MSK-IMPACT__CNS_Cancer",
  "MSK-IMPACT__Cancer_of_Unknown_Primary",
  "MSK-IMPACT__Cervical_Cancer",
  "MSK-IMPACT__Colorectal_Cancer",
  "MSK-IMPACT__Endometrial_Cancer",
  "MSK-IMPACT__Esophagogastric_Cancer",
  "MSK-IMPACT__Gastrointestinal_Neuroendocrine_Tumor",
  "MSK-IMPACT__Gastrointestinal_Stromal_Tumor",
  "MSK-IMPACT__Germ_Cell_Tumor",
  "MSK-IMPACT__Glioma",
  "MSK-IMPACT__Head_and_Neck_Cancer",
  "MSK-IMPACT__Hepatobiliary_Cancer",
  "MSK-IMPACT__Melanoma",
  "MSK-IMPACT__Mesothelioma",
  "MSK-IMPACT__Nerve_Sheath_Tumor",
  "MSK-IMPACT__Non_Small_Cell_Lung_Cancer",
  "MSK-IMPACT__Ovarian_Cancer",
  "MSK-IMPACT__Pancreatic_Cancer",
  "MSK-IMPACT__Peripheral_Nervous_System",
  "MSK-IMPACT__Prostate_Cancer",
  "MSK-IMPACT__Renal_Cell_Carcinoma",
  "MSK-IMPACT__Salivary_Gland_Cancer",
  "MSK-IMPACT__Skin_Cancer_Non_Melanoma",
  "MSK-IMPACT__Small_Bowel_Cancer",
  "MSK-IMPACT__Small_Cell_Lung_Cancer",
  "MSK-IMPACT__Soft_Tissue_Sarcoma",
  "MSK-IMPACT__Thyroid_Cancer",
  "MSK-IMPACT__Uterine_Sarcoma",
  "TCGA__ACC",
  "TCGA__BLCA",
  "TCGA__BRCA",
  "TCGA__CESC",
  "TCGA__CHOL",
  "TCGA__CRAD",
  "TCGA__DLBC",
  "TCGA__ESCA",
  "TCGA__GBM",
  "TCGA__HNSC",
  "TCGA__KICH",
  "TCGA__KIRC",
  "TCGA__KIRP",
  "TCGA__LAML",
  "TCGA__LGG",
  "TCGA__LIHC",
  "TCGA__LUAD",
  "TCGA__LUSC",
  "TCGA__MESO",
  "TCGA__OV",
  "TCGA__PAAD",
  "TCGA__PCPG",
  "TCGA__PRAD",
  "TCGA__SARC",
  "TCGA__SKCM",
  "TCGA__STAD",
  "TCGA__TGCT",
  "TCGA__THCA",
  "TCGA__THYM",
  "TCGA__UCEC",
  "TCGA__UCS",
  "TCGA__UVM",
];
const BMRS = ["cbase", "dig", "mutsig"];
const TCGA_CANCER_NAMES = {
  ACC: "Adrenocortical carcinoma",
  BLCA: "Bladder urothelial carcinoma",
  BRCA: "Breast invasive carcinoma",
  CESC: "Cervical squamous cell carcinoma",
  CHOL: "Cholangiocarcinoma",
  CRAD: "Colorectal adenocarcinoma",
  DLBC: "Diffuse large B-cell lymphoma",
  ESCA: "Esophageal carcinoma",
  GBM: "Glioblastoma",
  HNSC: "Head and neck squamous cell carcinoma",
  KICH: "Kidney chromophobe",
  KIRC: "Kidney clear cell carcinoma",
  KIRP: "Kidney papillary cell carcinoma",
  LAML: "Acute myeloid leukemia",
  LGG: "Lower-grade glioma",
  LIHC: "Liver hepatocellular carcinoma",
  LUAD: "Lung adenocarcinoma",
  LUSC: "Lung squamous cell carcinoma",
  MESO: "Mesothelioma",
  OV: "Ovarian serous cystadenocarcinoma",
  PAAD: "Pancreatic adenocarcinoma",
  PCPG: "Pheochromocytoma and paraganglioma",
  PRAD: "Prostate adenocarcinoma",
  SARC: "Sarcoma",
  SKCM: "Skin cutaneous melanoma",
  STAD: "Stomach adenocarcinoma",
  TGCT: "Testicular germ cell tumor",
  THCA: "Thyroid carcinoma",
  THYM: "Thymoma",
  UCEC: "Uterine endometrial carcinoma",
  UCS: "Uterine carcinosarcoma",
  UVM: "Uveal melanoma",
};
const RELEASE_SOURCE_FILES = [
  "analysis/build_atlas_data.py",
  "analysis/build_atlas_baselines.py",
  "src/dialect/models/assembly.py",
  "src/dialect/models/gene.py",
  "src/dialect/models/interaction.py",
  "src/dialect/utils/identify.py",
  "analysis/mutsig_lambda_co.py",
];
const BASELINE_SOURCE_FILES = [
  "analysis/build_atlas_baselines.py",
  "src/dialect/api.py",
  "src/dialect/baselines/runner.py",
  "src/dialect/baselines/fishers.py",
  "src/dialect/baselines/discover.py",
  "src/dialect/baselines/megsa.py",
  "src/dialect/baselines/wesme.py",
  "src/dialect/models/assembly.py",
  "src/dialect/models/interaction.py",
  "external/MEGSA/MEGSA.R",
  "external/WeSME/WeSME.py",
];
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
const BASELINE_METHOD_CONTRACT = {
  discover: {
    call_rule: "direction-specific BH q < 0.01",
    columns: ["Discover ME P-Val", "Discover CO P-Val", "Discover ME Q-Val", "Discover CO Q-Val"],
    directions: ["ME", "CO"],
    status: "complete",
  },
  fisher: {
    call_rule: "direction-specific BH q < 0.01",
    columns: ["Fisher's ME P-Val", "Fisher's CO P-Val", "Fisher's ME Q-Val", "Fisher's CO Q-Val"],
    directions: ["ME", "CO"],
    status: "complete",
  },
  megsa: {
    call_rule: "p < 0.001",
    columns: ["MEGSA S-Score (LRT)", "MEGSA P-Val", "MEGSA Q-Val"],
    directions: ["ME"],
    status: "complete",
  },
  wesco: {
    call_rule: "BH q < 0.01",
    columns: ["WeSCO P-Val", "WeSCO Q-Val"],
    directions: ["CO"],
    status: "complete",
  },
  wesme: {
    call_rule: "BH q < 0.01",
    columns: ["WeSME P-Val", "WeSME Q-Val"],
    directions: ["ME"],
    status: "complete",
  },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameArray(actual, expected) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(value, expected, label) {
  assert(plainObject(value), `${label}: expected object`);
  assert(new Set(expected).size === expected.length, `${label}: duplicate key in validator contract`);
  assert(
    sameArray(Object.keys(value).sort(codePointCompare), [...expected].sort(codePointCompare)),
    `${label}: field contract drift`,
  );
}

function assertDeepEqual(actual, expected, message) {
  assert(isDeepStrictEqual(actual, expected), message);
}

function validCanonicalTimestamp(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().replace(".000Z", "Z") === value
  );
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function assertPortableJson(buffer, label) {
  const contents = buffer.toString("utf8");
  assert(!contents.includes("/Users/"), `${label}: machine-local macOS path leaked`);
  assert(!/[A-Za-z]:\\\\Users\\\\/.test(contents), `${label}: machine-local Windows path leaked`);
  assert(!contents.includes("file://"), `${label}: file URI leaked`);
}

async function readCanonicalFile(root, relativePath, expectedPath, label) {
  assert(relativePath === expectedPath, `${label}: noncanonical release path`);
  assert(!relativePath.startsWith("/") && !relativePath.split("/").includes(".."), `${label}: unsafe release path`);
  const rootPath = resolve(root);
  const path = resolve(rootPath, relativePath);
  assert(path.startsWith(`${rootPath}/`), `${label}: release path escapes root`);
  const info = await lstat(path);
  assert(info.isFile() && !info.isSymbolicLink(), `${label}: release artifact is not a regular file`);
  return readFile(path);
}

function unorderedKey(a, b) {
  return a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`;
}

function codePointCompare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function baseGene(geneEffect) {
  return geneEffect.replace(/_[MN]$/, "");
}

function validGeneEffect(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*_[MN]$/.test(value);
}

function validBaseGene(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

async function validateLikelyPassengerAnnotations(releaseRoot, expectedCohortIds) {
  const dataRoot = resolve(releaseRoot, "../..");
  const buffer = await readCanonicalFile(
    dataRoot,
    LIKELY_PASSENGER_FILE,
    LIKELY_PASSENGER_FILE,
    "likely-passenger annotations",
  );
  assertPortableJson(buffer, "likely-passenger annotations");
  assert(
    sha256(buffer) === LIKELY_PASSENGER_SHA256,
    "likely-passenger annotation SHA-256 mismatch",
  );
  const annotations = JSON.parse(buffer);
  assertExactKeys(
    annotations,
    [
      "annotation_id",
      "schema_version",
      "definition",
      "driver_reference",
      "driver_reference_sha256",
      "cohorts",
    ],
    "likely-passenger annotations",
  );
  assert(annotations.annotation_id === "likely-passengers-v1", "likely-passenger annotation ID mismatch");
  assert(annotations.schema_version === "1.0.0", "likely-passenger annotation schema mismatch");
  assert(
    annotations.driver_reference === "data/references/OncoKB_Cancer_Gene_List.tsv" &&
      annotations.driver_reference_sha256 === ONCOKB_REFERENCE_SHA256,
    "likely-passenger driver-reference provenance mismatch",
  );
  assert(
    annotations.cohorts && typeof annotations.cohorts === "object" && !Array.isArray(annotations.cohorts),
    "likely-passenger cohorts must be an object",
  );
  const cohortIds = Object.keys(annotations.cohorts);
  assert(sameArray(cohortIds, expectedCohortIds), "likely-passenger cohort identity/order mismatch");
  let featureCount = 0;
  for (const cohortId of cohortIds) {
    const features = annotations.cohorts[cohortId];
    assert(Array.isArray(features), `${cohortId}: likely-passenger features must be an array`);
    assert(features.length > 0 && features.length <= 100, `${cohortId}: likely-passenger count invalid`);
    assert(new Set(features).size === features.length, `${cohortId}: duplicate likely-passenger feature`);
    assert(features.every(validGeneEffect), `${cohortId}: invalid likely-passenger gene effect`);
    featureCount += features.length;
  }
  assert(featureCount === 4351, "likely-passenger feature coverage mismatch");
}

function expectedCancerName(study, cohort) {
  return study === "TCGA" ? TCGA_CANCER_NAMES[cohort] : cohort.replaceAll("_", " ");
}

function expectedCbioUrl(study, cohort) {
  if (study !== "TCGA") return "";
  const studyId = cohort === "CRAD" ? "coadread" : cohort.toLowerCase();
  return `https://www.cbioportal.org/study/summary?id=${studyId}_tcga_pan_can_atlas_2018`;
}

function expectedBaselineSeed(cohortId) {
  const digest = createHash("sha256")
    .update(`${BASELINE_RELEASE_SEED}:${cohortId}`)
    .digest();
  return digest.readUInt32BE(0);
}

// Numerical Recipes erfc approximation. Error is below 1.2e-7, enough to gate
// stored double-precision chi-square p-values after allowing a 5e-7 tolerance.
function erfc(x) {
  const z = Math.abs(x);
  const t = 1 / (1 + z / 2);
  const answer =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? answer : 2 - answer;
}

function bhAdjust(pValues) {
  const order = pValues.map((p, index) => ({ p, index })).sort((a, b) => a.p - b.p || a.index - b.index);
  const adjusted = new Array(pValues.length);
  let running = 1;
  for (let rank = order.length; rank >= 1; rank -= 1) {
    const item = order[rank - 1];
    running = Math.min(running, (item.p * order.length) / rank, 1);
    adjusted[item.index] = running;
  }
  return adjusted;
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateSourceRecord(record, label) {
  assert(record && typeof record === "object", `${label}: missing source record`);
  assert(typeof record.path === "string" && record.path.length > 0, `${label}: missing source path`);
  assert(
    !record.path.startsWith("/") &&
      !record.path.includes("\\") &&
      !record.path.split("/").includes(".."),
    `${label}: unsafe source path`,
  );
  assert(/^[a-f0-9]{64}$/.test(record.sha256), `${label}: invalid source SHA-256`);
  assert(Number.isInteger(record.bytes) && record.bytes > 0, `${label}: invalid source byte count`);
  assert(!Number.isNaN(Date.parse(record.modified_at_utc)), `${label}: invalid source timestamp`);
}

function cohortSourceRoot(record) {
  if (record.study === "TCGA") return `output/pancan/${record.cohort}`;
  if (record.study === "MSK-IMPACT") return `output/msk/IMPACT2026/${record.cohort}`;
  return `output/msk/CHORD2024/${record.cohort}`;
}

function mutsigSourceRoot(record) {
  if (record.study === "TCGA") return `output/mutsigsrc/${record.cohort}`;
  if (record.study === "MSK-IMPACT") return `output/mutsigsrc_msk/IMPACT2026/${record.cohort}`;
  return `output/mutsigsrc_msk/CHORD2024/${record.cohort}`;
}

function validateIndexRecord(record, position) {
  const label = `index/cohorts/${position}`;
  assertExactKeys(
    record,
    [
      "id",
      "study",
      "cohort",
      "cancer",
      "n_samples",
      "median_mutations",
      "cbio",
      "model_summaries",
      "baseline_summary",
      "testing_universe",
      "data_file",
      "data_sha256",
      "data_bytes",
    ],
    label,
  );
  const expectedId = EXPECTED_COHORT_IDS[position];
  assert(record.id === expectedId, `${label}: canonical cohort ID/order drift`);
  const separator = expectedId.indexOf("__");
  const expectedStudy = expectedId.slice(0, separator);
  const expectedCohort = expectedId.slice(separator + 2);
  assert(record.study === expectedStudy, `${label}: study does not match cohort ID`);
  assert(record.cohort === expectedCohort, `${label}: cohort name does not match cohort ID`);
  assert(record.id === `${record.study}__${record.cohort}`, `${label}: malformed cohort ID`);
  assert(
    record.cancer === expectedCancerName(record.study, record.cohort),
    `${label}: cancer label drift`,
  );
  assert(record.cbio === expectedCbioUrl(record.study, record.cohort), `${label}: cBioPortal URL drift`);
  assert(Number.isSafeInteger(record.n_samples) && record.n_samples > 0, `${label}: invalid sample count`);
  assert(
    finiteNumber(record.median_mutations) && record.median_mutations >= 0,
    `${label}: invalid median mutation count`,
  );
  assertExactKeys(record.model_summaries, BMRS, `${label}/model-summaries`);
  assert(plainObject(record.baseline_summary), `${label}: missing baseline summary`);
  assert(plainObject(record.testing_universe), `${label}: missing testing-universe summary`);
  assert(record.data_file === `cohorts/${record.id}.json`, `${label}: noncanonical cohort data path`);
  assert(/^[a-f0-9]{64}$/.test(record.data_sha256), `${label}: invalid cohort data hash`);
  assert(Number.isSafeInteger(record.data_bytes) && record.data_bytes > 0, `${label}: invalid cohort byte count`);
}

function validateCohortTransport(cohort, record) {
  const label = record.id;
  assertExactKeys(
    cohort,
    ["id", "drivers", "models", "baselines", "testing_universes", "provenance"],
    label,
  );
  assert(cohort.id === record.id, `${label}: cohort ID mismatch`);
  assertExactKeys(cohort.models, BMRS, `${label}/models`);
  assert(Array.isArray(cohort.drivers), `${label}: missing driver annotations`);
  assert(
    cohort.drivers.every(validBaseGene) &&
      new Set(cohort.drivers).size === cohort.drivers.length &&
      sameArray(cohort.drivers, [...cohort.drivers].sort(codePointCompare)),
    `${label}: driver annotations must be sorted, unique base-gene IDs`,
  );
  for (const bmr of BMRS) {
    assertDeepEqual(
      record.model_summaries[bmr],
      cohort.models[bmr]?.summary,
      `${label}: ${bmr} index/model summary mismatch`,
    );
  }
  assertDeepEqual(
    record.baseline_summary,
    cohort.baselines?.summary,
    `${label}: baseline index/cohort summary mismatch`,
  );
}

function validateCohortProvenance(cohort, record) {
  const label = `${record.id}/provenance`;
  assertExactKeys(cohort.provenance, ["count_matrix", "bmr_inputs"], label);
  assertExactKeys(cohort.provenance.count_matrix, ["path", "sha256", "bytes", "modified_at_utc"], `${label}/count-matrix`);
  validateSourceRecord(cohort.provenance?.count_matrix, `${label}/count-matrix`);
  const inputs = cohort.provenance?.bmr_inputs;
  assertExactKeys(inputs, BMRS, `${label}/bmr-inputs`);
  assertExactKeys(inputs.cbase, ["path", "sha256", "bytes", "modified_at_utc"], `${label}/cbase-input`);
  assertExactKeys(inputs.dig, ["path", "sha256", "bytes", "modified_at_utc"], `${label}/dig-input`);
  validateSourceRecord(inputs?.cbase, `${label}/cbase-input`);
  validateSourceRecord(inputs?.dig, `${label}/dig-input`);
  const sourceRoot = cohortSourceRoot(record);
  assert(cohort.provenance.count_matrix.path === `${sourceRoot}/count_matrix.csv`, `${label}: count-matrix path mismatch`);
  assert(inputs.cbase.path === `${sourceRoot}/bmr_pmfs.csv`, `${label}: CBaSE input path mismatch`);
  assert(inputs.dig.path === `${sourceRoot}/bmr_pmfs.dig.csv`, `${label}: DIG input path mismatch`);
  const mutsig = inputs?.mutsig;
  assert(mutsig && typeof mutsig === "object", `${label}: missing MutSig input provenance`);
  assertExactKeys(
    mutsig,
    ["directory", "files", "dimensions", "sample_mapping", "feature_origin_policy"],
    `${label}/mutsig`,
  );
  const mutsigFiles = mutsig.files;
  const mutsigRoot = mutsigSourceRoot(record);
  assert(mutsig.directory === mutsigRoot, `${label}: MutSig directory mismatch`);
  const required = [
    "persample_lambda.f32",
    "persample_meta.txt",
    "persample_genes.txt",
    "persample_patients.txt",
  ];
  assertExactKeys(mutsigFiles, required, `${label}/mutsig/files`);
  for (const name of required) {
    assertExactKeys(
      mutsigFiles[name],
      ["path", "sha256", "bytes", "modified_at_utc"],
      `${label}/mutsig/${name}`,
    );
    validateSourceRecord(mutsigFiles?.[name], `${label}/mutsig/${name}`);
    assert(mutsigFiles[name].path === `${mutsigRoot}/${name}`, `${label}: MutSig ${name} path mismatch`);
  }
  const dimensions = mutsig.dimensions;
  assertExactKeys(dimensions, ["ng", "np", "neff"], `${label}/mutsig/dimensions`);
  assert(
    Number.isSafeInteger(dimensions.ng) && dimensions.ng > 0,
    `${label}: invalid MutSig gene dimension`,
  );
  assert(
    Number.isSafeInteger(dimensions.np) && dimensions.np > 0,
    `${label}: invalid MutSig patient dimension`,
  );
  assert(dimensions.neff === 2, `${label}: MutSig effect dimension must equal 2`);
  assert(
    mutsigFiles["persample_lambda.f32"].bytes ===
      dimensions.ng * dimensions.np * dimensions.neff * 4,
    `${label}: MutSig lambda byte count does not match its dimensions`,
  );
  const mapping = mutsig.sample_mapping;
  assertExactKeys(
    mapping,
    ["cohort_samples", "matched_samples", "cohort_mean_fallback_samples", "fallback_policy"],
    `${label}/mutsig/sample-mapping`,
  );
  for (const field of ["cohort_samples", "matched_samples", "cohort_mean_fallback_samples"]) {
    assert(
      Number.isSafeInteger(mapping[field]) && mapping[field] >= 0,
      `${label}: invalid MutSig ${field}`,
    );
  }
  assert(mapping.cohort_samples === record.n_samples, `${label}: MutSig sample total mismatch`);
  assert(
    mapping.matched_samples + mapping.cohort_mean_fallback_samples === record.n_samples,
    `${label}: MutSig matched/fallback total mismatch`,
  );
  assert(
    mapping.matched_samples <= dimensions.np,
    `${label}: MutSig matched-sample count exceeds its patient axis`,
  );
  assert(
    typeof mutsig.feature_origin_policy === "string" &&
      mutsig.feature_origin_policy.includes("CBaSE PMF"),
    `${label}: MutSig feature-origin policy missing`,
  );
  assert(
    mapping.fallback_policy ===
      "samples absent from the MutSig patient axis receive the gene-specific cohort-mean lambda",
    `${label}: MutSig sample fallback policy drift`,
  );

  for (const bmr of BMRS) {
    assertExactKeys(
      cohort.models[bmr].source,
      ["path", "sha256", "bytes", "modified_at_utc"],
      `${label}/${bmr}-result`,
    );
    validateSourceRecord(cohort.models[bmr].source, `${label}/${bmr}-result`);
    assert(
      cohort.models[bmr].source.path === `${sourceRoot}/id_${bmr}/pairwise_interaction_results.csv`,
      `${label}: ${bmr} result path mismatch`,
    );
  }
  validateSourceRecord(cohort.baselines.source, `${label}/baseline-result`);
  assert(
    cohort.baselines.source.path ===
      `output/atlas_baselines/k100/${record.study}/${record.cohort}/comparison_pairwise_interaction_results.csv`,
    `${label}: baseline result path mismatch`,
  );
  const latestMutsigInput = Math.max(...required.map((name) => Date.parse(mutsigFiles[name].modified_at_utc)));
  assert(
    Date.parse(cohort.models.mutsig.source.modified_at_utc) >= latestMutsigInput,
    `${label}: MutSig result predates its per-sample lambda inputs`,
  );
  assert(
    Date.parse(cohort.models.cbase.source.modified_at_utc) >= Date.parse(inputs.cbase.modified_at_utc),
    `${label}: CBaSE result predates its PMF input`,
  );
  assert(
    Date.parse(cohort.models.dig.source.modified_at_utc) >= Date.parse(inputs.dig.modified_at_utc),
    `${label}: DIG result predates its PMF input`,
  );
  assert(
    Date.parse(cohort.baselines.source.modified_at_utc) >=
      Date.parse(cohort.provenance.count_matrix.modified_at_utc),
    `${label}: baseline result predates its count-matrix input`,
  );
}

function validatePairUniverse(rows, fields, summary, label) {
  assert(Array.isArray(fields) && Array.isArray(rows), `${label}: invalid compact table`);
  assert(plainObject(summary), `${label}: missing summary`);
  const ga = fields.indexOf("ga");
  const gb = fields.indexOf("gb");
  const genes = new Set();
  const pairs = new Set();
  for (const row of rows) {
    assert(row.length === fields.length, `${label}: row width drift`);
    assert(validGeneEffect(row[ga]) && validGeneEffect(row[gb]), `${label}: invalid gene-effect ID`);
    assert(row[ga] !== row[gb], `${label}: self-pair`);
    genes.add(row[ga]);
    genes.add(row[gb]);
    const key = unorderedKey(row[ga], row[gb]);
    assert(!pairs.has(key), `${label}: duplicate unordered pair ${row[ga]}:${row[gb]}`);
    pairs.add(key);
  }
  const expected = (genes.size * (genes.size - 1)) / 2;
  assert(genes.size >= 2, `${label}: empty feature universe`);
  assert(rows.length === expected, `${label}: ${rows.length} rows is not C(${genes.size},2)`);
  assert(Number.isSafeInteger(summary.features) && summary.features === genes.size, `${label}: feature summary mismatch`);
  assert(
    Number.isSafeInteger(summary.tested_pairs) && summary.tested_pairs === rows.length,
    `${label}: pair summary mismatch`,
  );
  return { genes, pairs };
}

function validateRanks(rows, index, direction, label) {
  const subset = rows.filter((row) => row[index.direction] === direction);
  subset.sort((a, b) => {
    if (direction === "ME" && a[index.rho] !== b[index.rho]) return a[index.rho] - b[index.rho];
    if (direction === "CO" && a[index.lrt] !== b[index.lrt]) return b[index.lrt] - a[index.lrt];
    return codePointCompare(a[index.ga], b[index.ga]) || codePointCompare(a[index.gb], b[index.gb]);
  });
  subset.forEach((row, position) => {
    assert(row[index.rank] === position + 1, `${label}: invalid ${direction} rank at ${row[index.ga]}:${row[index.gb]}`);
  });
}

function validateDialectModel(model, nSamples, label) {
  assertExactKeys(model, ["fields", "rows", "summary", "source"], label);
  assertExactKeys(
    model.summary,
    [
      "features",
      "tested_pairs",
      "directions",
      "significant_q_lt_0_01",
      "negative_lrt_count",
      "em_support",
    ],
    `${label}/summary`,
  );
  assertExactKeys(model.summary.directions, ["ME", "CO", "neutral"], `${label}/summary/directions`);
  assertExactKeys(
    model.summary.significant_q_lt_0_01,
    ["ME", "CO", "neutral"],
    `${label}/summary/significant`,
  );
  assertExactKeys(
    model.summary.em_support,
    ["rows_with_excluded_samples", "max_excluded_samples"],
    `${label}/summary/em-support`,
  );
  assert(sameArray(model.fields, DIALECT_FIELDS), `${label}: DIALECT field contract drift`);
  const universe = validatePairUniverse(model.rows, model.fields, model.summary, label);
  const index = Object.fromEntries(model.fields.map((field, position) => [field, position]));
  const pValues = [];
  const storedQ = [];
  const directionCounts = { CO: 0, ME: 0, neutral: 0 };
  const significantCounts = { CO: 0, ME: 0, neutral: 0 };
  const carriers = new Map();
  const contingencies = new Map();
  let negativeLrtCount = 0;
  let rowsWithExcludedSamples = 0;
  let maxExcludedSamples = 0;

  for (const row of model.rows) {
    for (const field of ["tau00", "tau10", "tau01", "tau11", "tau1x", "taux1", "rho", "lrt", "p", "q"]) {
      assert(finiteNumber(row[index[field]]), `${label}: non-finite ${field}`);
    }
    const tauSum = row[index.tau00] + row[index.tau10] + row[index.tau01] + row[index.tau11];
    assert(finiteNumber(row[index.tau_mass]), `${label}: non-finite tau_mass`);
    assert(Math.abs(row[index.tau_mass] - tauSum) <= 1e-12, `${label}: tau_mass mismatch`);
    assert(
      Number.isInteger(row[index.effective_n]) && row[index.effective_n] > 0,
      `${label}: invalid effective_n`,
    );
    assert(
      Number.isInteger(row[index.excluded_samples]) && row[index.excluded_samples] >= 0,
      `${label}: invalid excluded_samples`,
    );
    assert(
      row[index.effective_n] + row[index.excluded_samples] === nSamples,
      `${label}: EM support total mismatch`,
    );
    assert(
      Math.abs(tauSum - row[index.effective_n] / nSamples) <= 1e-10,
      `${label}: tau mass is not explained by effective EM samples`,
    );
    if (row[index.excluded_samples] > 0) rowsWithExcludedSamples += 1;
    maxExcludedSamples = Math.max(maxExcludedSamples, row[index.excluded_samples]);
    for (const field of ["tau00", "tau10", "tau01", "tau11"]) {
      assert(row[index[field]] >= -1e-10 && row[index[field]] <= 1 + 1e-10, `${label}: ${field} outside [0,1]`);
    }
    assert(
      Math.abs(row[index.tau1x] - (row[index.tau10] + row[index.tau11])) <= 1e-10,
      `${label}: tau1x marginal mismatch`,
    );
    assert(
      Math.abs(row[index.taux1] - (row[index.tau01] + row[index.tau11])) <= 1e-10,
      `${label}: taux1 marginal mismatch`,
    );
    const denominator = Math.sqrt(
      (row[index.tau00] + row[index.tau01]) *
        (row[index.tau10] + row[index.tau11]) *
        (row[index.tau00] + row[index.tau10]) *
        (row[index.tau01] + row[index.tau11]),
    );
    assert(denominator > 0, `${label}: degenerate tau marginals`);
    const expectedRho =
      (row[index.tau11] * row[index.tau00] - row[index.tau01] * row[index.tau10]) /
      denominator;
    assert(Math.abs(row[index.rho] - expectedRho) <= 1e-10, `${label}: rho/tau mismatch`);
    const oddsDefined =
      row[index.tau01] * row[index.tau10] > 0 && row[index.tau00] * row[index.tau11] > 0;
    if (oddsDefined) {
      const expectedLogOdds = Math.log(
        (row[index.tau01] * row[index.tau10]) / (row[index.tau00] * row[index.tau11]),
      );
      const expectedWald =
        expectedLogOdds /
        Math.sqrt(
          1 / row[index.tau01] +
            1 / row[index.tau10] +
            1 / row[index.tau00] +
            1 / row[index.tau11],
        );
      assert(
        finiteNumber(row[index.log_odds_ratio]) &&
          Math.abs(row[index.log_odds_ratio] - expectedLogOdds) <= 1e-10,
        `${label}: log-odds/tau mismatch`,
      );
      assert(
        finiteNumber(row[index.wald]) && Math.abs(row[index.wald] - expectedWald) <= 1e-10,
        `${label}: Wald/tau mismatch`,
      );
    } else {
      assert(row[index.log_odds_ratio] === null, `${label}: undefined log odds must be null`);
      assert(row[index.wald] === null, `${label}: undefined Wald must be null`);
    }
    assert(row[index.rho] >= -1 && row[index.rho] <= 1, `${label}: rho outside [-1,1]`);
    const contingency = [
      row[index.observed_both],
      row[index.observed_b_only],
      row[index.observed_a_only],
      row[index.observed_neither],
    ];
    assert(
      contingency.every((count) => Number.isInteger(count) && count >= 0),
      `${label}: invalid contingency count`,
    );
    assert(contingency.reduce((sum, count) => sum + count, 0) === nSamples, `${label}: contingency total mismatch`);
    const carrierA = row[index.observed_both] + row[index.observed_a_only];
    const carrierB = row[index.observed_both] + row[index.observed_b_only];
    for (const [gene, count] of [
      [row[index.ga], carrierA],
      [row[index.gb], carrierB],
    ]) {
      const prior = carriers.get(gene);
      assert(prior === undefined || prior === count, `${label}: inconsistent carrier count for ${gene}`);
      carriers.set(gene, count);
    }
    const canonicalContingency =
      row[index.ga] < row[index.gb]
        ? [
            row[index.observed_both],
            row[index.observed_a_only],
            row[index.observed_b_only],
            row[index.observed_neither],
          ]
        : [
            row[index.observed_both],
            row[index.observed_b_only],
            row[index.observed_a_only],
            row[index.observed_neither],
          ];
    contingencies.set(unorderedKey(row[index.ga], row[index.gb]), canonicalContingency);

    const expectedDirection = row[index.rho] < 0 ? "ME" : row[index.rho] > 0 ? "CO" : "neutral";
    assert(row[index.direction] === expectedDirection, `${label}: rho/direction mismatch`);
    assert(Number.isInteger(row[index.rank]) && row[index.rank] >= 0, `${label}: invalid rank`);
    assert((expectedDirection === "neutral") === (row[index.rank] === 0), `${label}: neutral rank mismatch`);
    directionCounts[expectedDirection] += 1;

    const p = erfc(Math.sqrt(Math.max(row[index.lrt], 0) / 2));
    assert(Math.abs(row[index.p] - p) <= 5e-7, `${label}: LRT p-value mismatch`);
    assert(row[index.p] >= 0 && row[index.p] <= 1, `${label}: p outside [0,1]`);
    assert(row[index.q] >= 0 && row[index.q] <= 1, `${label}: q outside [0,1]`);
    if (row[index.q] < 0.01) significantCounts[expectedDirection] += 1;
    if (row[index.lrt] < 0) negativeLrtCount += 1;
    pValues.push(row[index.p]);
    storedQ.push(row[index.q]);
  }

  const expectedQ = bhAdjust(pValues);
  expectedQ.forEach((q, position) => {
    assert(Math.abs(storedQ[position] - q) <= 1e-12, `${label}: unified BH q-value mismatch`);
  });
  for (const direction of ["ME", "CO", "neutral"]) {
    assert(model.summary.directions[direction] === directionCounts[direction], `${label}: direction summary mismatch`);
    assert(
      model.summary.significant_q_lt_0_01[direction] === significantCounts[direction],
      `${label}: FDR summary mismatch`,
    );
  }
  assert(model.summary.negative_lrt_count === negativeLrtCount, `${label}: negative-LRT summary mismatch`);
  assertDeepEqual(
    model.summary.em_support,
    {
      rows_with_excluded_samples: rowsWithExcludedSamples,
      max_excluded_samples: maxExcludedSamples,
    },
    `${label}: EM-support summary mismatch`,
  );
  validateRanks(model.rows, index, "ME", label);
  validateRanks(model.rows, index, "CO", label);
  return { ...universe, carriers, contingencies };
}

function validateObservedConsistency(modelUniverses, label) {
  const carriers = new Map();
  const contingencies = new Map();
  for (const bmr of BMRS) {
    for (const [gene, count] of modelUniverses[bmr].carriers) {
      const prior = carriers.get(gene);
      assert(
        prior === undefined || prior.count === count,
        `${label}: ${gene} carrier count differs between ${prior?.bmr} and ${bmr}`,
      );
      carriers.set(gene, { count, bmr });
    }
    for (const [pair, contingency] of modelUniverses[bmr].contingencies) {
      const prior = contingencies.get(pair);
      assert(
        prior === undefined || sameArray(prior.contingency, contingency),
        `${label}: ${pair.replace("\u0000", ":")} contingency differs between ${prior?.bmr} and ${bmr}`,
      );
      contingencies.set(pair, { contingency, bmr });
    }
  }
}

function validateBaselines(baselines, record, cohort, label) {
  assertExactKeys(baselines, ["fields", "rows", "summary", "source"], label);
  assertExactKeys(baselines.summary, ["features", "tested_pairs", "significant_calls"], `${label}/summary`);
  assertExactKeys(
    baselines.summary.significant_calls,
    ["fisher_me", "fisher_co", "discover_me", "discover_co", "megsa_me", "wesme_me", "wesco_co"],
    `${label}/summary/significant-calls`,
  );
  assertExactKeys(
    baselines.source,
    ["path", "sha256", "bytes", "modified_at_utc", "metadata"],
    `${label}/source`,
  );
  validateSourceRecord(baselines.source, `${label}/source`);
  assert(sameArray(baselines.fields, BASELINE_FIELDS), `${label}: baseline field contract drift`);
  const universe = validatePairUniverse(baselines.rows, baselines.fields, baselines.summary, label);
  const index = Object.fromEntries(baselines.fields.map((field, position) => [field, position]));
  const probabilityIndexes = baselines.fields
    .map((field, index) => ({ field, index }))
    .filter(({ field }) => field.endsWith("_p") || field.endsWith("_q"));
  for (const row of baselines.rows) {
    for (let index = 2; index < row.length; index += 1) {
      assert(finiteNumber(row[index]), `${label}: non-finite baseline value`);
    }
    for (const { field, index } of probabilityIndexes) {
      assert(row[index] >= 0 && row[index] <= 1, `${label}: ${field} outside [0,1]`);
    }
    assert(row[index.megsa_lrt] >= 0, `${label}: negative MEGSA LRT`);
    for (const [method, meField, coField] of [
      ["Fisher", "fisher_me_p", "fisher_co_p"],
      ["DISCOVER", "discover_me_p", "discover_co_p"],
    ]) {
      const oneSidedSum = row[index[meField]] + row[index[coField]];
      assert(
        oneSidedSum >= 1 - 1e-12 && oneSidedSum <= 2 + 1e-12,
        `${label}: ${method} one-sided p-values are inconsistent`,
      );
    }
  }

  const qFamilies = [
    ["fisher_me_p", "fisher_me_q"],
    ["fisher_co_p", "fisher_co_q"],
    ["discover_me_p", "discover_me_q"],
    ["discover_co_p", "discover_co_q"],
    ["megsa_p", "megsa_q"],
    ["wesme_p", "wesme_q"],
    ["wesco_p", "wesco_q"],
  ];
  for (const [pField, qField] of qFamilies) {
    const expected = bhAdjust(baselines.rows.map((row) => row[index[pField]]));
    expected.forEach((q, position) => {
      assert(
        Math.abs(baselines.rows[position][index[qField]] - q) <= 1e-10,
        `${label}: ${qField} is not BH-adjusted from ${pField}`,
      );
    });
  }
  for (const row of baselines.rows) {
    const expectedMegsa = 0.5 * erfc(Math.sqrt(row[index.megsa_lrt] / 2));
    assert(Math.abs(row[index.megsa_p] - expectedMegsa) <= 5e-7, `${label}: MEGSA p-value mismatch`);
  }

  const expectedCalls = {
    fisher_me: baselines.rows.filter((row) => row[index.fisher_me_q] < 0.01).length,
    fisher_co: baselines.rows.filter((row) => row[index.fisher_co_q] < 0.01).length,
    discover_me: baselines.rows.filter((row) => row[index.discover_me_q] < 0.01).length,
    discover_co: baselines.rows.filter((row) => row[index.discover_co_q] < 0.01).length,
    megsa_me: baselines.rows.filter((row) => row[index.megsa_p] < 0.001).length,
    wesme_me: baselines.rows.filter((row) => row[index.wesme_q] < 0.01).length,
    wesco_co: baselines.rows.filter((row) => row[index.wesco_q] < 0.01).length,
  };
  assertDeepEqual(
    baselines.summary.significant_calls,
    expectedCalls,
    `${label}: baseline significant-call summary mismatch`,
  );
  const metadata = baselines.source.metadata;
  assertExactKeys(
    metadata,
    [
      "schema_version",
      "release_id",
      "source_gene_k",
      "release_seed",
      "cohort",
      "rng",
      "top_features",
      "method_coverage",
      "input",
      "artifacts",
    ],
    `${label}/metadata`,
  );
  assert(metadata.schema_version === BASELINE_SCHEMA_VERSION, `${label}: baseline metadata schema drift`);
  assert(metadata.release_id === BASELINE_RELEASE_ID, `${label}: baseline metadata release ID drift`);
  assert(metadata.source_gene_k === 100, `${label}: baseline metadata is not K=100`);
  assert(metadata.release_seed === BASELINE_RELEASE_SEED, `${label}: baseline release seed drift`);

  const metadataCohort = metadata.cohort;
  assertExactKeys(
    metadataCohort,
    ["id", "study", "name", "n_samples", "n_input_features", "n_tested_features", "expected_pair_count"],
    `${label}/metadata/cohort`,
  );
  assert(metadataCohort.id === record.id, `${label}: baseline cohort ID mismatch`);
  assert(metadataCohort.study === record.study, `${label}: baseline study mismatch`);
  assert(metadataCohort.name === record.cohort, `${label}: baseline cohort name mismatch`);
  assert(metadataCohort.n_samples === record.n_samples, `${label}: baseline sample count mismatch`);
  assert(
    Number.isSafeInteger(metadataCohort.n_input_features) && metadataCohort.n_input_features >= 2,
    `${label}: invalid baseline input-feature count`,
  );
  assert(
    metadataCohort.n_tested_features === Math.min(100, metadataCohort.n_input_features) &&
      metadataCohort.n_tested_features === universe.genes.size,
    `${label}: baseline tested-feature count is not exact K=100`,
  );
  assert(
    metadataCohort.expected_pair_count === baselines.rows.length,
    `${label}: baseline expected-pair count mismatch`,
  );

  const recordedFeatures = metadata.top_features;
  assert(Array.isArray(recordedFeatures), `${label}: baseline top-feature provenance missing`);
  assert(
    recordedFeatures.length === universe.genes.size &&
      new Set(recordedFeatures).size === recordedFeatures.length &&
      recordedFeatures.every(validGeneEffect),
    `${label}: invalid baseline top-feature provenance`,
  );
  assert(
    sameArray([...recordedFeatures].sort(codePointCompare), [...universe.genes].sort(codePointCompare)),
    `${label}: baseline top-feature provenance mismatch`,
  );
  assertDeepEqual(
    metadata.method_coverage,
    BASELINE_METHOD_CONTRACT,
    `${label}: baseline five-method coverage contract drift`,
  );

  assertExactKeys(metadata.input, ["path", "sha256"], `${label}/metadata/input`);
  assert(
    metadata.input.path === cohort.provenance.count_matrix.path &&
      metadata.input.sha256 === cohort.provenance.count_matrix.sha256,
    `${label}: baseline input is not the cohort count matrix`,
  );

  assertExactKeys(
    metadata.artifacts,
    ["comparison", "data_tree_sha256", "data_file_count"],
    `${label}/metadata/artifacts`,
  );
  assertExactKeys(
    metadata.artifacts.comparison,
    ["path", "sha256", "rows"],
    `${label}/metadata/artifacts/comparison`,
  );
  assert(
    metadata.artifacts.comparison.path === baselines.source.path &&
      metadata.artifacts.comparison.sha256 === baselines.source.sha256 &&
      metadata.artifacts.comparison.rows === baselines.rows.length,
    `${label}: baseline comparison artifact association mismatch`,
  );
  assert(
    /^[a-f0-9]{64}$/.test(metadata.artifacts.data_tree_sha256),
    `${label}: invalid baseline data-tree hash`,
  );
  assert(
    Number.isSafeInteger(metadata.artifacts.data_file_count) && metadata.artifacts.data_file_count > 0,
    `${label}: invalid baseline data-file count`,
  );

  assertExactKeys(metadata.rng, ["library", "seed", "derivation"], `${label}/metadata/rng`);
  assert(
    metadata.rng.library === "numpy.random legacy global RNG" &&
      metadata.rng.derivation === "uint32(sha256('<release_seed>:<study>__<cohort>')[0:4])" &&
      metadata.rng.seed === expectedBaselineSeed(record.id),
    `${label}: baseline RNG provenance mismatch`,
  );
  return universe;
}

function validateTestingUniverses(cohort, record, modelUniverses, baselineUniverse) {
  const label = `${record.id}/testing-universes`;
  const reported = cohort.testing_universes;
  assert(reported && typeof reported === "object", `${label}: missing testing-universe record`);
  assertExactKeys(reported, ["policy", "models", "baseline", "summary"], label);
  assert(
    reported.policy ===
      "top count-ranked features available to each BMR; consensus uses only exact pairs tested by all three",
    `${label}: testing-universe policy drift`,
  );
  assertExactKeys(reported.models, BMRS, `${label}/models`);
  assertExactKeys(reported.baseline, ["features"], `${label}/baseline`);
  assertExactKeys(
    reported.summary,
    [
      "common_dialect_features",
      "union_dialect_features",
      "common_dialect_pairs",
      "baseline_pairs_shared_with_all_dialect",
      "mutsig_pairs_with_cbase_fallback",
      "common_dialect_pairs_with_mutsig_fallback",
    ],
    `${label}/summary`,
  );
  const commonFeatures = new Set(
    [...modelUniverses.cbase.genes].filter(
      (gene) => modelUniverses.dig.genes.has(gene) && modelUniverses.mutsig.genes.has(gene),
    ),
  );
  const unionFeatures = new Set(BMRS.flatMap((bmr) => [...modelUniverses[bmr].genes]));
  const commonPairs = new Set(
    [...modelUniverses.cbase.pairs].filter(
      (pair) => modelUniverses.dig.pairs.has(pair) && modelUniverses.mutsig.pairs.has(pair),
    ),
  );
  const sharedBaselinePairs = [...commonPairs].filter((pair) => baselineUniverse.pairs.has(pair)).length;
  for (const bmr of BMRS) {
    const selection = reported.models[bmr];
    assertExactKeys(
      selection,
      bmr === "mutsig" ? ["features", "features_sha256", "origins", "origin_summary"] : ["features", "features_sha256"],
      `${label}/${bmr}`,
    );
    assert(Array.isArray(selection.features), `${label}: ${bmr} count-ranked feature list missing`);
    assert(
      new Set(selection.features).size === selection.features.length,
      `${label}: duplicate ${bmr} count-ranked feature`,
    );
    assert(
      sameArray([...selection.features].sort(codePointCompare), [...modelUniverses[bmr].genes].sort(codePointCompare)),
      `${label}: ${bmr} exact count-ranked feature set mismatch`,
    );
    assert(
      selection.features_sha256 === sha256(Buffer.from(JSON.stringify(selection.features))),
      `${label}: ${bmr} count-ranked feature digest mismatch`,
    );
  }
  const mutsigOrigins = reported.models.mutsig.origins;
  assert(mutsigOrigins && typeof mutsigOrigins === "object", `${label}: MutSig feature origins missing`);
  assertExactKeys(mutsigOrigins, ["mutsig_lambda", "cbase_fallback"], `${label}/mutsig/origins`);
  assertExactKeys(
    reported.models.mutsig.origin_summary,
    ["mutsig_lambda", "cbase_fallback"],
    `${label}/mutsig/origin-summary`,
  );
  const lambdaFeatures = mutsigOrigins.mutsig_lambda;
  const fallbackFeatures = mutsigOrigins.cbase_fallback;
  assert(Array.isArray(lambdaFeatures) && Array.isArray(fallbackFeatures), `${label}: invalid MutSig origin lists`);
  const lambdaSet = new Set(lambdaFeatures);
  const fallbackSet = new Set(fallbackFeatures);
  assert(lambdaSet.size === lambdaFeatures.length, `${label}: duplicate MutSig lambda feature`);
  assert(fallbackSet.size === fallbackFeatures.length, `${label}: duplicate CBaSE fallback feature`);
  assert(
    [...lambdaSet].every((feature) => !fallbackSet.has(feature)),
    `${label}: overlapping MutSig feature origins`,
  );
  assert(
    sameArray(
      [...lambdaFeatures, ...fallbackFeatures].sort(codePointCompare),
      [...modelUniverses.mutsig.genes].sort(codePointCompare),
    ),
    `${label}: MutSig origins do not partition its selected features`,
  );
  assertDeepEqual(
    reported.models.mutsig.origin_summary,
    {
      mutsig_lambda: lambdaFeatures.length,
      cbase_fallback: fallbackFeatures.length,
    },
    `${label}: MutSig feature-origin summary mismatch`,
  );
  const mutsigOrder = new Map(
    reported.models.mutsig.features.map((feature, position) => [feature, position]),
  );
  for (const [origin, features] of Object.entries(mutsigOrigins)) {
    assert(
      features.every((feature, position) => position === 0 || mutsigOrder.get(features[position - 1]) < mutsigOrder.get(feature)),
      `${label}: ${origin} features do not preserve the published MutSig ranking`,
    );
  }
  assert(
    Array.isArray(reported.baseline.features) &&
      sameArray(reported.baseline.features, [...baselineUniverse.genes].sort(codePointCompare)),
    `${label}: baseline feature list mismatch`,
  );
  const expectedSummary = {
    common_dialect_features: commonFeatures.size,
    union_dialect_features: unionFeatures.size,
    common_dialect_pairs: commonPairs.size,
    baseline_pairs_shared_with_all_dialect: sharedBaselinePairs,
    mutsig_pairs_with_cbase_fallback: [...modelUniverses.mutsig.pairs].filter((pair) =>
      pair.split("\u0000").some((feature) => fallbackSet.has(feature)),
    ).length,
    common_dialect_pairs_with_mutsig_fallback: [...commonPairs].filter((pair) =>
      pair.split("\u0000").some((feature) => fallbackSet.has(feature)),
    ).length,
  };
  const eligibleModelFeatures = record.testing_universe?.eligible_model_features;
  const expectedTestedFeatures = record.testing_universe?.expected_tested_features;
  const modelFeatureSha256 = record.testing_universe?.model_feature_sha256;
  const mutsigFeatureOrigins = record.testing_universe?.mutsig_feature_origins;
  assertExactKeys(
    record.testing_universe,
    [
      "model_features",
      "eligible_model_features",
      "expected_tested_features",
      "model_feature_sha256",
      "mutsig_feature_origins",
      "mutsig_cbase_fallback_sha256",
      "baseline_features",
      "common_dialect_features",
      "union_dialect_features",
      "common_dialect_pairs",
      "baseline_pairs_shared_with_all_dialect",
      "mutsig_pairs_with_cbase_fallback",
      "common_dialect_pairs_with_mutsig_fallback",
    ],
    `${label}/index`,
  );
  for (const [name, value] of [
    ["model_features", record.testing_universe.model_features],
    ["eligible_model_features", eligibleModelFeatures],
    ["expected_tested_features", expectedTestedFeatures],
    ["model_feature_sha256", modelFeatureSha256],
  ]) {
    assertExactKeys(value, BMRS, `${label}/index/${name}`);
  }
  assertExactKeys(
    mutsigFeatureOrigins,
    ["mutsig_lambda", "cbase_fallback"],
    `${label}/index/mutsig-feature-origins`,
  );
  for (const bmr of BMRS) {
    assert(
      Number.isInteger(eligibleModelFeatures?.[bmr]) && eligibleModelFeatures[bmr] >= modelUniverses[bmr].genes.size,
      `${label}: invalid ${bmr} eligible-feature count`,
    );
    assert(
      expectedTestedFeatures?.[bmr] === Math.min(100, eligibleModelFeatures[bmr]),
      `${label}: ${bmr} is not proven K=100`,
    );
    assert(
      modelUniverses[bmr].genes.size === expectedTestedFeatures[bmr],
      `${label}: ${bmr} tested-feature count is not K=100`,
    );
    assert(
      modelFeatureSha256?.[bmr] === reported.models[bmr].features_sha256,
      `${label}: ${bmr} feature digest is not cross-linked from the index`,
    );
  }
  assertDeepEqual(
    mutsigFeatureOrigins,
    {
      mutsig_lambda: lambdaFeatures.length,
      cbase_fallback: fallbackFeatures.length,
    },
    `${label}: index MutSig origin counts mismatch`,
  );
  assert(
    record.testing_universe?.mutsig_cbase_fallback_sha256 ===
      sha256(Buffer.from(JSON.stringify(fallbackFeatures))),
    `${label}: index MutSig fallback digest mismatch`,
  );
  assert(
    record.testing_universe.baseline_features === baselineUniverse.genes.size,
    `${label}: index baseline-feature count mismatch`,
  );
  assertDeepEqual(reported.summary, expectedSummary, `${label}: summary mismatch`);
  assertDeepEqual(
    record.testing_universe,
    {
      model_features: Object.fromEntries(BMRS.map((bmr) => [bmr, modelUniverses[bmr].genes.size])),
      eligible_model_features: eligibleModelFeatures,
      expected_tested_features: expectedTestedFeatures,
      model_feature_sha256: modelFeatureSha256,
      mutsig_feature_origins: mutsigFeatureOrigins,
      mutsig_cbase_fallback_sha256: record.testing_universe.mutsig_cbase_fallback_sha256,
      baseline_features: baselineUniverse.genes.size,
      ...expectedSummary,
    },
    `${label}: index summary mismatch`,
  );
}

function topVisibleMe(model) {
  const index = Object.fromEntries(model.fields.map((field, position) => [field, position]));
  return model.rows
    .filter(
      (row) =>
        row[index.direction] === "ME" && baseGene(row[index.ga]) !== baseGene(row[index.gb]),
    )
    .sort((a, b) => a[index.rank] - b[index.rank])[0];
}

function topConsensusMe(models, mutsigFallbackFeatures) {
  const fallback = new Set(mutsigFallbackFeatures);
  const modelMaps = BMRS.map((bmr) => {
    const model = models[bmr];
    const index = Object.fromEntries(model.fields.map((field, position) => [field, position]));
    const total = model.summary.directions.ME;
    const pairs = new Map();
    for (const row of model.rows) {
      if (row[index.direction] !== "ME" || baseGene(row[index.ga]) === baseGene(row[index.gb])) continue;
      if (fallback.has(row[index.ga]) || fallback.has(row[index.gb])) continue;
      pairs.set(unorderedKey(row[index.ga], row[index.gb]), { row, index, percentile: row[index.rank] / total });
    }
    return pairs;
  });
  const shared = [];
  for (const [key, first] of modelMaps[0]) {
    const evidence = [first, modelMaps[1].get(key), modelMaps[2].get(key)];
    if (evidence.some((value) => value === undefined)) continue;
    const percentiles = evidence.map((value) => value.percentile).sort((a, b) => a - b);
    shared.push({ key, worst: percentiles[2], median: percentiles[1] });
  }
  shared.sort((a, b) => a.worst - b.worst || a.median - b.median || codePointCompare(a.key, b.key));
  return shared[0]?.key;
}

function validateManifestTransport(manifest) {
  assertExactKeys(
    manifest,
    [
      "release_id",
      "schema_version",
      "immutable",
      "generated_at",
      "title",
      "coverage",
      "analysis",
      "bmrs",
      "methods",
      "provenance",
      "index_file",
      "index_sha256",
      "index_bytes",
      "readme_file",
      "readme_sha256",
      "readme_bytes",
    ],
    "manifest",
  );
  assert(manifest.release_id === RELEASE_ID, "manifest release ID mismatch");
  assert(manifest.schema_version === "2.0.0", "manifest schema mismatch");
  assert(manifest.immutable === true, "release is not marked immutable");
  assert(manifest.title === "DIALECT Atlas complete K=100 release", "manifest title drift");
  assert(validCanonicalTimestamp(manifest.generated_at), "manifest generated_at is not canonical UTC");
  assert(manifest.index_file === "index.json", "manifest index path is not canonical");
  assert(/^[a-f0-9]{64}$/.test(manifest.index_sha256), "manifest index hash is invalid");
  assert(Number.isSafeInteger(manifest.index_bytes) && manifest.index_bytes > 0, "manifest index byte count is invalid");
  assert(manifest.readme_file === "README.md", "manifest README path is not canonical");
  assert(/^[a-f0-9]{64}$/.test(manifest.readme_sha256), "manifest README hash is invalid");
  assert(Number.isSafeInteger(manifest.readme_bytes) && manifest.readme_bytes > 0, "manifest README byte count is invalid");

  assertExactKeys(
    manifest.coverage,
    [
      "cohorts",
      "cohort_ids_sha256",
      "studies",
      "samples",
      "dialect_tables",
      "baseline_tables",
      "mutsig_cbase_fallback_feature_instances",
      "mutsig_pair_rows_with_cbase_fallback",
    ],
    "manifest/coverage",
  );
  assert(manifest.coverage.cohorts === 71, "manifest must cover 71 cohorts");
  assertDeepEqual(manifest.coverage.studies, EXPECTED_STUDIES, "study coverage drift");
  assert(Number.isSafeInteger(manifest.coverage.samples) && manifest.coverage.samples > 0, "invalid sample coverage");
  for (const field of [
    "mutsig_cbase_fallback_feature_instances",
    "mutsig_pair_rows_with_cbase_fallback",
  ]) {
    assert(
      Number.isSafeInteger(manifest.coverage[field]) && manifest.coverage[field] >= 0,
      `invalid manifest coverage field: ${field}`,
    );
  }

  assertExactKeys(
    manifest.analysis,
    [
      "top_k_event_features",
      "p_value",
      "multiple_testing",
      "fdr_threshold",
      "fdr_operator",
      "direction",
      "ranking",
      "epsilon_filter",
      "same_base_pair_policy",
      "feature_universe_policy",
      "feature_tie_policy",
      "negative_lrt_policy",
      "default_consensus",
      "strict_consensus",
      "unsupported_sample_policy",
      "mutsig_feature_fallback_policy",
    ],
    "manifest/analysis",
  );
  assert(manifest.analysis.top_k_event_features === 100, "release is not K=100");
  assert(manifest.analysis.p_value === "chi2.sf(max(lrt, 0), df=1)", "DIALECT p-value policy drift");
  assert(manifest.analysis.epsilon_filter === false, "epsilon filter must be disabled");
  assert(manifest.analysis.fdr_threshold === 0.01 && manifest.analysis.fdr_operator === "<", "FDR contract drift");
  assert(manifest.analysis.direction === "rho < 0: ME; rho > 0: CO; rho = 0: neutral", "direction contract drift");
  assertDeepEqual(manifest.analysis.ranking, { CO: "raw LRT descending", ME: "rho ascending" }, "ranking contract drift");
  assert(manifest.analysis.same_base_pair_policy.includes("retained in testing family"), "same-base-pair policy missing");
  assert(manifest.analysis.negative_lrt_policy.includes("raw value preserved"), "negative-LRT policy missing");
  assert(manifest.analysis.strict_consensus === "q < 0.01 in all three BMRs", "strict consensus policy drift");

  assertDeepEqual(
    manifest.bmrs,
    [
      { id: "cbase", label: "CBaSE", role: "primary" },
      { id: "dig", label: "DIG", role: "robustness" },
      { id: "mutsig", label: "MutSigCV2", role: "robustness" },
    ],
    "BMR manifest contract drift",
  );
  assertDeepEqual(
    manifest.methods,
    {
      dialect: { directions: ["ME", "CO"], multiple_testing_family: "unified ME+CO" },
      discover: {
        directions: ["ME", "CO"],
        multiple_testing_family: "separate by direction",
        upstream: {
          commit: "a46d99f9a8a76dc6302f42c814650ca2a1568267",
          python_source_sha256: "117ea3646653e7fafd1311e94f5fc62c8500ea3eb2f22eabb4fa8d5b109d5e3c",
          repository: "https://github.com/NKI-CCB/DISCOVER",
          tag: "py_v0.9.6",
        },
        version: "0.9.6",
      },
      fisher: { directions: ["ME", "CO"], multiple_testing_family: "separate by direction" },
      megsa: { call_rule: "p < 0.001", directions: ["ME"] },
      wesme_wesco: {
        directions: ["ME", "CO"],
        multiple_testing_family: "separate by direction",
        seeded: true,
      },
    },
    "method manifest contract drift",
  );

  assertExactKeys(
    manifest.provenance,
    [
      "dialect_repository",
      "release_assembly_commit",
      "inference_run_commit",
      "inference_run_commit_note",
      "generator",
      "generator_sha256",
      "source_snapshot",
      "driver_reference",
      "driver_reference_sha256",
      "baseline_release",
    ],
    "manifest/provenance",
  );
  assert(manifest.provenance.dialect_repository === "https://github.com/raphael-group/dialect", "DIALECT repository provenance drift");
  assert(manifest.provenance.generator === "analysis/build_atlas_data.py", "release generator path drift");
  assert(manifest.provenance.driver_reference === "data/references/OncoKB_Cancer_Gene_List.tsv", "driver reference path drift");
  assert(/^[a-f0-9]{64}$/.test(manifest.provenance.driver_reference_sha256), "invalid driver-reference hash");

  const baselineRelease = manifest.provenance.baseline_release;
  assertExactKeys(
    baselineRelease,
    ["path", "sha256", "release_id", "release_seed", "provenance"],
    "manifest/provenance/baseline-release",
  );
  assert(baselineRelease.path === "output/atlas_baselines/k100/manifest.json", "baseline manifest path drift");
  assert(/^[a-f0-9]{64}$/.test(baselineRelease.sha256), "invalid baseline manifest hash");
  assert(baselineRelease.release_id === BASELINE_RELEASE_ID, "baseline release ID drift");
  assert(baselineRelease.release_seed === BASELINE_RELEASE_SEED, "baseline release seed drift");
  assertExactKeys(
    baselineRelease.provenance,
    ["generated_at_utc", "python", "packages", "git", "source_files", "discover", "rscript"],
    "manifest/provenance/baseline-release/provenance",
  );
  assert(!Number.isNaN(Date.parse(baselineRelease.provenance.generated_at_utc)), "invalid baseline generation timestamp");
  assert(typeof baselineRelease.provenance.python === "string" && baselineRelease.provenance.python.length > 0, "missing baseline Python provenance");
  assert(typeof baselineRelease.provenance.rscript === "string" && baselineRelease.provenance.rscript.length > 0, "missing baseline R provenance");
  assertExactKeys(
    baselineRelease.provenance.packages,
    ["dialect", "numpy", "pandas", "scipy", "statsmodels", "networkx"],
    "manifest/provenance/baseline-release/packages",
  );
  assert(
    Object.values(baselineRelease.provenance.packages).every(
      (version) => typeof version === "string" && version.length > 0,
    ),
    "invalid baseline package provenance",
  );
  assertExactKeys(
    baselineRelease.provenance.git,
    ["commit", "dirty_tracked_files"],
    "manifest/provenance/baseline-release/git",
  );
  assert(/^[a-f0-9]{40}$/.test(baselineRelease.provenance.git.commit), "invalid baseline Git commit");
  assert(
    typeof baselineRelease.provenance.git.dirty_tracked_files === "boolean",
    "invalid baseline Git dirty-state provenance",
  );
  assertDeepEqual(
    baselineRelease.provenance.discover,
    {
      python_source_sha256: "117ea3646653e7fafd1311e94f5fc62c8500ea3eb2f22eabb4fa8d5b109d5e3c",
      version: "0.9.6",
    },
    "baseline DISCOVER provenance drift",
  );
}

async function validateRelease(root) {
  const rootInfo = await lstat(root);
  assert(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), "release root is not a regular directory");
  const rootEntries = await readdir(root, { withFileTypes: true });
  assert(
    sameArray(
      rootEntries.map((entry) => entry.name).sort(codePointCompare),
      ["README.md", "cohorts", "index.json", "manifest.json"],
    ),
    "release root contains missing or unexpected entries",
  );
  for (const entry of rootEntries) {
    if (entry.name === "cohorts") {
      assert(entry.isDirectory() && !entry.isSymbolicLink(), "cohorts is not a regular directory");
    } else {
      assert(entry.isFile() && !entry.isSymbolicLink(), `${entry.name} is not a regular file`);
    }
  }
  const cohortsDirectory = resolve(root, "cohorts");
  const cohortsInfo = await lstat(cohortsDirectory);
  assert(cohortsInfo.isDirectory() && !cohortsInfo.isSymbolicLink(), "cohorts is not a regular directory");
  const cohortEntries = await readdir(cohortsDirectory, { withFileTypes: true });
  const expectedCohortFiles = EXPECTED_COHORT_IDS.map((id) => `${id}.json`);
  assert(
    sameArray(
      cohortEntries.map((entry) => entry.name).sort(codePointCompare),
      [...expectedCohortFiles].sort(codePointCompare),
    ),
    "cohort directory contains missing or unexpected entries",
  );
  for (const entry of cohortEntries) {
    assert(entry.isFile() && !entry.isSymbolicLink(), `cohorts/${entry.name} is not a regular file`);
  }

  const manifestBuffer = await readCanonicalFile(root, "manifest.json", "manifest.json", "manifest");
  assertPortableJson(manifestBuffer, "manifest");
  const manifest = JSON.parse(manifestBuffer);
  validateManifestTransport(manifest);
  assert(
    manifest.coverage.cohort_ids_sha256 === sha256(Buffer.from(JSON.stringify(EXPECTED_COHORT_IDS))),
    "canonical cohort identity digest drift",
  );
  assert(manifest.coverage.dialect_tables === 213, "DIALECT table coverage drift");
  assert(manifest.coverage.baseline_tables === 71, "baseline table coverage drift");
  assert(manifest.provenance.inference_run_commit === null, "historical mixed inference must not be attributed to current HEAD");
  assert(/^[a-f0-9]{40}$/.test(manifest.provenance.release_assembly_commit), "release assembly commit missing");
  assertExactKeys(manifest.provenance.source_snapshot, RELEASE_SOURCE_FILES, "release source snapshot");
  for (const path of RELEASE_SOURCE_FILES) {
    assert(
      /^[a-f0-9]{64}$/.test(manifest.provenance.source_snapshot[path]),
      `invalid release source hash: ${path}`,
    );
  }
  assert(
    manifest.provenance.generator_sha256 ===
      manifest.provenance.source_snapshot["analysis/build_atlas_data.py"],
    "release generator hash is not cross-linked",
  );
  const baselineSources = manifest.provenance.baseline_release?.provenance?.source_files;
  assertExactKeys(baselineSources, BASELINE_SOURCE_FILES, "baseline source snapshot");
  for (const [path, digest] of Object.entries(baselineSources)) {
    assert(!path.startsWith("/") && !path.includes(".."), `invalid baseline source path: ${path}`);
    assert(/^[a-f0-9]{64}$/.test(digest), `invalid baseline source hash: ${path}`);
  }
  assert(
    baselineSources["analysis/build_atlas_baselines.py"] ===
      manifest.provenance.source_snapshot["analysis/build_atlas_baselines.py"],
    "baseline generator source is not cross-linked to release assembly",
  );
  assert(
    manifest.analysis.unsupported_sample_policy.includes("effective_n") &&
      manifest.analysis.unsupported_sample_policy.includes("not renormalized"),
    "unsupported-sample disclosure missing",
  );
  assert(
    manifest.analysis.feature_tie_policy.cbase_dig.includes("column order") &&
      manifest.analysis.feature_tie_policy.mutsig.includes("quicksort") &&
      typeof manifest.analysis.feature_tie_policy.validation_pandas_version === "string",
    "feature tie-policy provenance missing",
  );

  const indexBuffer = await readCanonicalFile(root, manifest.index_file, "index.json", "index");
  assertPortableJson(indexBuffer, "index");
  assert(sha256(indexBuffer) === manifest.index_sha256, "index SHA-256 mismatch");
  assert(indexBuffer.byteLength === manifest.index_bytes, "index byte count mismatch");
  const index = JSON.parse(indexBuffer);
  assertExactKeys(index, ["release_id", "cohorts"], "index");
  const readmeBuffer = await readCanonicalFile(root, manifest.readme_file, "README.md", "README");
  assertPortableJson(readmeBuffer, "README");
  assert(sha256(readmeBuffer) === manifest.readme_sha256, "README SHA-256 mismatch");
  assert(readmeBuffer.byteLength === manifest.readme_bytes, "README byte count mismatch");
  assert(index.release_id === RELEASE_ID, "index release ID mismatch");
  assert(Array.isArray(index.cohorts), "index cohorts must be an array");
  assert(index.cohorts.length === 71, "index cohort count mismatch");
  index.cohorts.forEach(validateIndexRecord);
  const orderedIds = index.cohorts.map((cohort) => cohort.id);
  assert(sameArray(orderedIds, EXPECTED_COHORT_IDS), "canonical cohort identity/order drift");
  const ids = new Set(orderedIds);
  assert(ids.size === 71, "duplicate cohort IDs");
  await validateLikelyPassengerAnnotations(root, orderedIds);
  assert(
    manifest.coverage.mutsig_cbase_fallback_feature_instances ===
      index.cohorts.reduce(
        (sum, cohort) =>
          sum + cohort.testing_universe.mutsig_feature_origins.cbase_fallback,
        0,
      ),
    "MutSig fallback-feature coverage mismatch",
  );
  assert(
    manifest.coverage.mutsig_pair_rows_with_cbase_fallback ===
      index.cohorts.reduce(
        (sum, cohort) =>
          sum + cohort.testing_universe.mutsig_pairs_with_cbase_fallback,
        0,
      ),
    "MutSig fallback-pair coverage mismatch",
  );

  let samples = 0;
  let dialectRows = 0;
  let baselineRows = 0;
  let chol = null;
  for (const [position, record] of index.cohorts.entries()) {
    const buffer = await readCanonicalFile(
      root,
      record.data_file,
      `cohorts/${record.id}.json`,
      record.id,
    );
    assertPortableJson(buffer, record.id);
    assert(buffer.byteLength === record.data_bytes, `${record.id}: byte count mismatch`);
    assert(sha256(buffer) === record.data_sha256, `${record.id}: SHA-256 mismatch`);
    const cohort = JSON.parse(buffer);
    validateCohortTransport(cohort, record);
    validateCohortProvenance(cohort, record);
    const modelUniverses = {};
    for (const bmr of BMRS) {
      modelUniverses[bmr] = validateDialectModel(
        cohort.models[bmr],
        record.n_samples,
        `${record.id}/${bmr}`,
      );
      dialectRows += cohort.models[bmr].rows.length;
    }
    validateObservedConsistency(modelUniverses, `${record.id}/observed-counts`);
    const baselineUniverse = validateBaselines(
      cohort.baselines,
      record,
      cohort,
      `${record.id}/baselines`,
    );
    validateTestingUniverses(cohort, record, modelUniverses, baselineUniverse);
    baselineRows += cohort.baselines.rows.length;
    samples += record.n_samples;
    if (record.id === "TCGA__CHOL") chol = cohort;
    if ((position + 1) % 10 === 0 || position + 1 === index.cohorts.length) {
      process.stdout.write(`validated ${position + 1}/${index.cohorts.length} cohorts\n`);
    }
  }
  assert(samples === manifest.coverage.samples, "sample coverage mismatch");
  assert(chol !== null, "TCGA CHOL regression cohort missing");
  const expectedChol = unorderedKey("IDH1_M", "PBRM1_N");
  for (const bmr of BMRS) {
    const row = topVisibleMe(chol.models[bmr]);
    const field = Object.fromEntries(chol.models[bmr].fields.map((name, index) => [name, index]));
    assert(unorderedKey(row[field.ga], row[field.gb]) === expectedChol, `CHOL ${bmr} top-ME regression failed`);
  }
  assert(
    topConsensusMe(
      chol.models,
      chol.testing_universes.models.mutsig.origins.cbase_fallback,
    ) === expectedChol,
    "CHOL distinct-background all-three consensus regression failed",
  );

  process.stdout.write(
    `release ${RELEASE_ID} valid: 71 cohorts, ${samples.toLocaleString()} samples, ` +
      `${dialectRows.toLocaleString()} DIALECT rows, ${baselineRows.toLocaleString()} baseline rows\n`,
  );
}

const scriptDirectory = resolve(fileURLToPath(new URL(".", import.meta.url)));
const defaultRoot = resolve(scriptDirectory, "../public/data/releases", RELEASE_ID);
const rootArgument = process.argv[2] ? resolve(process.argv[2]) : defaultRoot;

validateRelease(rootArgument).catch((error) => {
  process.stderr.write(`release validation failed: ${error.message}\n`);
  process.exitCode = 1;
});
