import {
  BMR_IDS,
  type BaselineRow,
  type Bmr,
  type CohortData,
  type CohortMeta,
  type CompactTable,
  type DialectRow,
  type LikelyPassengerAnnotations,
  type ReleaseIndex,
  type ReleaseManifest,
  type ManifestMethodId,
  type TransportDirection,
} from "@/features/atlas/types";

export class DataContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataContractError";
  }
}

type RecordValue = Record<string, unknown>;

function object(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DataContractError(`${label} must be an object`);
  }
  return value as RecordValue;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string") throw new DataContractError(`${label} must be a string`);
  return value;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new DataContractError(`${label} must be a boolean`);
  return value;
}

function number(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DataContractError(`${label} must be a finite number`);
  }
  return value;
}

function nullableNumber(value: unknown, label: string): number | null {
  if (value == null || value === "") return null;
  return number(value, label);
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new DataContractError(`${label} must be an array`);
  return value.map((item, index) => string(item, `${label}[${index}]`));
}

function table(value: unknown, label: string): CompactTable {
  const rec = object(value, label);
  const fields = stringArray(rec.fields, `${label}.fields`);
  if (!Array.isArray(rec.rows)) throw new DataContractError(`${label}.rows must be an array`);
  const rows = rec.rows.map((row, index) => {
    if (!Array.isArray(row)) throw new DataContractError(`${label}.rows[${index}] must be an array`);
    if (row.length !== fields.length) {
      throw new DataContractError(
        `${label}.rows[${index}] has ${row.length} values for ${fields.length} fields`,
      );
    }
    return row;
  });
  return { fields, rows };
}

function records(value: unknown, label: string): RecordValue[] {
  const compact = table(value, label);
  return compact.rows.map((row) => Object.fromEntries(compact.fields.map((field, i) => [field, row[i]])));
}

function read(rec: RecordValue, field: string, label: string): unknown {
  if (!(field in rec)) throw new DataContractError(`${label} is missing field '${field}'`);
  return rec[field];
}

function readAny(rec: RecordValue, fields: string[]): unknown {
  for (const field of fields) if (field in rec) return rec[field];
  return null;
}

function direction(value: unknown, label: string): TransportDirection {
  if (value === "ME" || value === "CO" || value === "neutral") return value;
  throw new DataContractError(`${label} must be ME, CO, or neutral`);
}

export function decodeManifest(value: unknown): ReleaseManifest {
  const rec = object(value, "manifest");
  const coverage = object(rec.coverage, "manifest.coverage");
  const analysis = object(rec.analysis, "manifest.analysis");
  const methodRecord = object(rec.methods, "manifest.methods");
  const methodIds: ManifestMethodId[] = [
    "dialect",
    "fisher",
    "discover",
    "megsa",
    "wesme_wesco",
  ];
  const methods = Object.fromEntries(methodIds.map((methodId) => {
    const method = object(methodRecord[methodId], `manifest.methods.${methodId}`);
    if (!Array.isArray(method.directions)) {
      throw new DataContractError(`manifest.methods.${methodId}.directions must be an array`);
    }
    return [methodId, {
      directions: method.directions.map((item, index) =>
        direction(item, `manifest.methods.${methodId}.directions[${index}]`),
      ).filter((item): item is "ME" | "CO" => item !== "neutral"),
    }];
  })) as ReleaseManifest["methods"];
  if (!Array.isArray(rec.bmrs)) throw new DataContractError("manifest.bmrs must be an array");
  return {
    release_id: string(rec.release_id, "manifest.release_id"),
    schema_version: string(rec.schema_version, "manifest.schema_version"),
    immutable: boolean(rec.immutable, "manifest.immutable"),
    generated_at: string(rec.generated_at, "manifest.generated_at"),
    coverage: {
      cohorts: number(coverage.cohorts, "manifest.coverage.cohorts"),
      samples: number(coverage.samples, "manifest.coverage.samples"),
    },
    analysis: {
      top_k_event_features: number(
        analysis.top_k_event_features,
        "manifest.analysis.top_k_event_features",
      ),
      fdr_threshold: number(analysis.fdr_threshold, "manifest.analysis.fdr_threshold"),
    },
    bmrs: rec.bmrs.map((item, index) => {
      const bmr = object(item, `manifest.bmrs[${index}]`);
      const id = string(bmr.id, `manifest.bmrs[${index}].id`);
      if (!BMR_IDS.includes(id as Bmr)) {
        throw new DataContractError(`manifest.bmrs[${index}].id must be a known background`);
      }
      return {
        id: id as Bmr,
        label: string(bmr.label, `manifest.bmrs[${index}].label`),
        role: string(bmr.role, `manifest.bmrs[${index}].role`),
      };
    }),
    methods,
    index_file: string(rec.index_file, "manifest.index_file"),
    readme_file: string(rec.readme_file, "manifest.readme_file"),
    readme_sha256: string(rec.readme_sha256, "manifest.readme_sha256"),
    readme_bytes: number(rec.readme_bytes, "manifest.readme_bytes"),
  };
}

function decodeCohortMeta(value: unknown, index: number): CohortMeta {
  const label = `index.cohorts[${index}]`;
  const rec = object(value, label);
  return {
    id: string(rec.id, `${label}.id`),
    study: string(rec.study, `${label}.study`),
    cohort: string(rec.cohort, `${label}.cohort`),
    cancer: string(rec.cancer, `${label}.cancer`),
    n_samples: number(rec.n_samples, `${label}.n_samples`),
    median_mutations: number(rec.median_mutations, `${label}.median_mutations`),
    cbio: string(rec.cbio ?? "", `${label}.cbio`),
    data_file: string(rec.data_file, `${label}.data_file`),
    data_sha256: string(rec.data_sha256, `${label}.data_sha256`),
    data_bytes: number(rec.data_bytes, `${label}.data_bytes`),
  };
}

export function decodeIndex(value: unknown): ReleaseIndex {
  const rec = object(value, "index");
  if (!Array.isArray(rec.cohorts)) throw new DataContractError("index.cohorts must be an array");
  return {
    release_id: string(rec.release_id, "index.release_id"),
    cohorts: rec.cohorts.map(decodeCohortMeta),
  };
}

export function decodeLikelyPassengerAnnotations(
  value: unknown,
): LikelyPassengerAnnotations {
  const rec = object(value, "likely-passenger annotations");
  const cohortRecord = object(rec.cohorts, "likely-passenger annotations.cohorts");
  const annotationId = string(
    rec.annotation_id,
    "likely-passenger annotations.annotation_id",
  );
  const schemaVersion = string(
    rec.schema_version,
    "likely-passenger annotations.schema_version",
  );
  const driverReferenceSha256 = string(
    rec.driver_reference_sha256,
    "likely-passenger annotations.driver_reference_sha256",
  );
  if (annotationId !== "likely-passengers-v1" || schemaVersion !== "1.0.0") {
    throw new DataContractError("likely-passenger annotation version is unsupported");
  }
  if (!/^[a-f0-9]{64}$/.test(driverReferenceSha256)) {
    throw new DataContractError(
      "likely-passenger annotations.driver_reference_sha256 must be SHA-256",
    );
  }
  return {
    annotation_id: annotationId,
    schema_version: schemaVersion,
    definition: string(rec.definition, "likely-passenger annotations.definition"),
    driver_reference: string(
      rec.driver_reference,
      "likely-passenger annotations.driver_reference",
    ),
    driver_reference_sha256: driverReferenceSha256,
    cohorts: Object.fromEntries(
      Object.entries(cohortRecord).map(([cohortId, value]) => {
        const features = stringArray(
          value,
          `likely-passenger annotations.cohorts.${cohortId}`,
        );
        if (
          features.length === 0 ||
          features.length > 100 ||
          features.length !== new Set(features).size ||
          features.some((feature) => !/^[A-Za-z0-9][A-Za-z0-9._-]*_[MN]$/.test(feature))
        ) {
          throw new DataContractError(
            `likely-passenger annotations.cohorts.${cohortId} is invalid`,
          );
        }
        return [cohortId, features];
      }),
    ),
  };
}

function decodeDialectRow(rec: RecordValue, label: string): DialectRow {
  return {
    ga: string(read(rec, "ga", label), `${label}.ga`),
    gb: string(read(rec, "gb", label), `${label}.gb`),
    tau00: number(read(rec, "tau00", label), `${label}.tau00`),
    tau10: number(read(rec, "tau10", label), `${label}.tau10`),
    tau01: number(read(rec, "tau01", label), `${label}.tau01`),
    tau11: number(read(rec, "tau11", label), `${label}.tau11`),
    observedBoth: number(read(rec, "observed_both", label), `${label}.observed_both`),
    observedBOnly: number(read(rec, "observed_b_only", label), `${label}.observed_b_only`),
    observedAOnly: number(read(rec, "observed_a_only", label), `${label}.observed_a_only`),
    observedNeither: number(read(rec, "observed_neither", label), `${label}.observed_neither`),
    tau1x: number(read(rec, "tau1x", label), `${label}.tau1x`),
    taux1: number(read(rec, "taux1", label), `${label}.taux1`),
    rho: number(read(rec, "rho", label), `${label}.rho`),
    logOddsRatio: nullableNumber(read(rec, "log_odds_ratio", label), `${label}.log_odds_ratio`),
    lrt: number(read(rec, "lrt", label), `${label}.lrt`),
    wald: nullableNumber(read(rec, "wald", label), `${label}.wald`),
    p: nullableNumber(read(rec, "p", label), `${label}.p`),
    q: nullableNumber(read(rec, "q", label), `${label}.q`),
    direction: direction(read(rec, "direction", label), `${label}.direction`),
    rank: number(read(rec, "rank", label), `${label}.rank`),
    tauMass: number(read(rec, "tau_mass", label), `${label}.tau_mass`),
    effectiveN: number(read(rec, "effective_n", label), `${label}.effective_n`),
    excludedSamples: number(
      read(rec, "excluded_samples", label),
      `${label}.excluded_samples`,
    ),
  };
}

function decodeBaselineRow(rec: RecordValue, label: string): BaselineRow {
  const n = (aliases: string[]) => nullableNumber(readAny(rec, aliases), `${label}.${aliases[0]}`);
  return {
    ga: string(readAny(rec, ["ga", "gene_a"]), `${label}.ga`),
    gb: string(readAny(rec, ["gb", "gene_b"]), `${label}.gb`),
    fisherMeP: n(["fisher_me_p", "fisher_me_pval"]),
    fisherCoP: n(["fisher_co_p", "fisher_co_pval"]),
    fisherMeQ: n(["fisher_me_q", "fisher_me_qval"]),
    fisherCoQ: n(["fisher_co_q", "fisher_co_qval"]),
    discoverMeP: n(["discover_me_p", "discover_me_pval"]),
    discoverCoP: n(["discover_co_p", "discover_co_pval"]),
    discoverMeQ: n(["discover_me_q", "discover_me_qval"]),
    discoverCoQ: n(["discover_co_q", "discover_co_qval"]),
    megsaScore: n(["megsa_lrt", "megsa_score", "megsa_s_score"]),
    megsaP: n(["megsa_p", "megsa_pval"]),
    megsaQ: n(["megsa_q", "megsa_qval"]),
    wesmeP: n(["wesme_p", "wesme_pval"]),
    wescoP: n(["wesco_p", "wesco_pval"]),
    wesmeQ: n(["wesme_q", "wesme_qval"]),
    wescoQ: n(["wesco_q", "wesco_qval"]),
  };
}

export function decodeCohort(value: unknown): CohortData {
  const rec = object(value, "cohort");
  const modelRecord = object(read(rec, "models", "cohort"), "cohort.models");
  const models = {} as Record<Bmr, DialectRow[]>;
  for (const bmr of BMR_IDS) {
    const source = read(modelRecord, bmr, "cohort.models");
    models[bmr] = records(source, `cohort.models.${bmr}`).map((row, i) =>
      decodeDialectRow(row, `cohort.models.${bmr}.rows[${i}]`),
    );
  }

  const baselineRows = records(read(rec, "baselines", "cohort"), "cohort.baselines").map(
    (row, i) => decodeBaselineRow(row, `cohort.baselines.rows[${i}]`),
  );
  const testingUniverses = object(
    read(rec, "testing_universes", "cohort"),
    "cohort.testing_universes",
  );
  const testingModels = object(
    read(testingUniverses, "models", "cohort.testing_universes"),
    "cohort.testing_universes.models",
  );
  const mutsigTesting = object(
    read(testingModels, "mutsig", "cohort.testing_universes.models"),
    "cohort.testing_universes.models.mutsig",
  );
  const mutsigOrigins = object(
    read(mutsigTesting, "origins", "cohort.testing_universes.models.mutsig"),
    "cohort.testing_universes.models.mutsig.origins",
  );

  return {
    id: string(rec.id, "cohort.id"),
    drivers: stringArray(rec.drivers ?? [], "cohort.drivers"),
    models,
    baselines: baselineRows,
    mutsigCbaseFallbackFeatures: stringArray(
      read(
        mutsigOrigins,
        "cbase_fallback",
        "cohort.testing_universes.models.mutsig.origins",
      ),
      "cohort.testing_universes.models.mutsig.origins.cbase_fallback",
    ),
  };
}
