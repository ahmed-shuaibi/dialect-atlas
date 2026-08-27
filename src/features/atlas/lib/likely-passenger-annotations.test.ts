import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  DataContractError,
  decodeIndex,
  decodeLikelyPassengerAnnotations,
} from "@/features/atlas/lib/decode";
import type {
  LikelyPassengerAnnotations,
  ReleaseIndex,
} from "@/features/atlas/types";

const atlasRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const dialectRoot = resolve(atlasRoot, "..");
const releaseRoot = resolve(
  atlasRoot,
  "public/data/releases/k100-2026-08-26",
);
const annotationPath = resolve(
  atlasRoot,
  "public/data/annotations/likely-passengers-v1.json",
);
const indexPath = resolve(releaseRoot, "index.json");
const builderPath = resolve(
  atlasRoot,
  "scripts/build-likely-passenger-annotations.mjs",
);
const driverPath = resolve(
  dialectRoot,
  "data/references/OncoKB_Cancer_Gene_List.tsv",
);
const sourceInputsAvailable = existsSync(driverPath);
const expectedDefinition =
  "Up to 100 mutation-count-ranked gene effects outside the OncoKB cancer-gene list, identified separately within each cohort.";
const expectedDriverSha256 =
  "56cea460e396451395738dbb8dbda5f5a8fe6fb146dde18c902c8b6bd6034193";
const expectedSidecarSha256 =
  "c8efd1f97359669ff21146e9ebcb61eaa6c109a1e22688beda291666c24e6cc2";
const eventFeaturePattern = /^[A-Za-z0-9][A-Za-z0-9._-]*_[MN]$/;

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

function sourceListPath(study: string, cohort: string): string {
  if (study === "TCGA") {
    return resolve(
      dialectRoot,
      "data/event_level_likely_passengers",
      `${cohort}.txt`,
    );
  }
  if (study === "MSK-CHORD" || study === "MSK-IMPACT") {
    const collection = study === "MSK-CHORD" ? "CHORD2024" : "IMPACT2026";
    return resolve(
      dialectRoot,
      "data/event_level_likely_passengers_msk",
      collection,
      `${cohort}.txt`,
    );
  }
  throw new Error(`Unexpected study: ${study}`);
}

async function readFeatureList(path: string): Promise<string[]> {
  return (await readFile(path, "utf8"))
    .split(/\r?\n/)
    .map((feature) => feature.trim())
    .filter(Boolean);
}

function sha256(contents: string | Buffer): string {
  return createHash("sha256").update(contents).digest("hex");
}

let annotations: LikelyPassengerAnnotations;
let index: ReleaseIndex;

beforeAll(async () => {
  annotations = decodeLikelyPassengerAnnotations(await readJson(annotationPath));
  index = decodeIndex(await readJson(indexPath));
});

describe("likely-passenger annotation contract", () => {
  it("decodes the published schema and verifies its driver-reference provenance", async () => {
    expect(annotations).toMatchObject({
      annotation_id: "likely-passengers-v1",
      schema_version: "1.0.0",
      definition: expectedDefinition,
      driver_reference: "data/references/OncoKB_Cancer_Gene_List.tsv",
    });
    expect(annotations.driver_reference_sha256).toBe(expectedDriverSha256);
    expect(sha256(await readFile(annotationPath))).toBe(expectedSidecarSha256);

    if (sourceInputsAvailable) {
      expect(annotations.driver_reference_sha256).toBe(
        sha256(await readFile(driverPath)),
      );
    }

    expect(() =>
      decodeLikelyPassengerAnnotations({
        ...annotations,
        driver_reference_sha256: 123,
      }),
    ).toThrow(DataContractError);
    expect(() =>
      decodeLikelyPassengerAnnotations({
        ...annotations,
        cohorts: { "TCGA__BRCA": ["TTN_M", 123] },
      }),
    ).toThrow(/TCGA__BRCA\[1\]/);
  });

  it("covers exactly every one of the 71 indexed cohorts", () => {
    const indexedIds = index.cohorts.map(({ id }) => id).sort();
    const annotatedIds = Object.keys(annotations.cohorts).sort();

    expect(index.release_id).toBe("k100-2026-08-26");
    expect(indexedIds).toHaveLength(71);
    expect(new Set(indexedIds).size).toBe(71);
    expect(annotatedIds).toEqual(indexedIds);
  });

  it("preserves exact cohort-specific event features from the paper inputs", async () => {
    const drivers = sourceInputsAvailable
      ? new Set(
          (await readFile(driverPath, "utf8"))
            .split(/\r?\n/)
            .slice(1)
            .filter(Boolean)
            .map((line) => line.split("\t", 1)[0]),
        )
      : null;
    let featureCount = 0;

    for (const cohort of index.cohorts) {
      const features = annotations.cohorts[cohort.id];

      if (sourceInputsAvailable) {
        expect(features, cohort.id).toEqual(
          await readFeatureList(sourceListPath(cohort.study, cohort.cohort)),
        );
      }
      expect(features.length, cohort.id).toBeGreaterThan(0);
      expect(features.length, cohort.id).toBeLessThanOrEqual(100);
      expect(new Set(features).size, cohort.id).toBe(features.length);
      for (const feature of features) {
        expect(feature, `${cohort.id}: ${feature}`).toMatch(eventFeaturePattern);
        if (drivers) {
          expect(
            drivers.has(feature.replace(/_[MN]$/, "")),
            `${cohort.id}: ${feature} overlaps OncoKB`,
          ).toBe(false);
        }
      }
      featureCount += features.length;
    }

    expect(featureCount).toBe(4_351);
    expect(annotations.cohorts["TCGA__BRCA"]).toContain("TTN_M");
    expect(annotations.cohorts["TCGA__BRCA"]).not.toContain("TTN");
    expect(annotations.cohorts["TCGA__BRCA"]).not.toContain("TTN_N");
  });

  it("keeps the generated sidecar outside the immutable release", async () => {
    expect(relative(releaseRoot, annotationPath).startsWith("..")).toBe(true);
    const builder = await readFile(builderPath, "utf8");
    expect(builder).toContain('"public/data/annotations/likely-passengers-v1.json"');
  });
});
