import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

const atlasRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dialectRoot = resolve(atlasRoot, "..");
const indexPath = resolve(
  atlasRoot,
  "public/data/releases/k100-2026-08-26/index.json",
);
const driverReference = "data/references/OncoKB_Cancer_Gene_List.tsv";
const outputPath = resolve(
  atlasRoot,
  "public/data/annotations/likely-passengers-v1.json",
);

function sourcePath(study, cohort) {
  if (study === "TCGA") {
    return resolve(dialectRoot, "data/event_level_likely_passengers", `${cohort}.txt`);
  }
  const collection = study === "MSK-CHORD" ? "CHORD2024" : "IMPACT2026";
  return resolve(
    dialectRoot,
    "data/event_level_likely_passengers_msk",
    collection,
    `${cohort}.txt`,
  );
}

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

const index = JSON.parse(await readFile(indexPath, "utf8"));
const driverContents = await readFile(resolve(dialectRoot, driverReference));
const cohorts = {};

for (const cohort of index.cohorts) {
  const text = await readFile(sourcePath(cohort.study, cohort.cohort), "utf8");
  const features = text.split(/\r?\n/).map((feature) => feature.trim()).filter(Boolean);
  if (features.length > 100 || features.length !== new Set(features).size) {
    throw new Error(`Invalid likely-passenger annotations for ${cohort.id}`);
  }
  if (features.some((feature) => !/^[A-Za-z0-9][A-Za-z0-9._-]*_[MN]$/.test(feature))) {
    throw new Error(`Invalid gene-effect identifier for ${cohort.id}`);
  }
  cohorts[cohort.id] = features;
}

const payload = {
  annotation_id: "likely-passengers-v1",
  schema_version: "1.0.0",
  definition: "Up to 100 mutation-count-ranked gene effects outside the OncoKB cancer-gene list, identified separately within each cohort.",
  driver_reference: driverReference,
  driver_reference_sha256: sha256(driverContents),
  cohorts,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
stdout.write(`Wrote ${Object.keys(cohorts).length} cohorts to ${outputPath}\n`);
