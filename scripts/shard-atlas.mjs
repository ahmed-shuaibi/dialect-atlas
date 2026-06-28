// One-off: shard the committed public/data/atlas.json into
//   - public/data/atlas/index.json   (small: cohort meta + per-cohort/per-bmr ME/CO counts;
//                                      everything needed before a cohort is selected)
//   - public/data/atlas/cohort/<id>.json  (heavy: drivers + full per-bmr ME/CO edges,
//                                           fetched lazily on cohort selection)
//
// The on-disk atlas.json stays untouched (still the regen target of build_atlas_data).
// Re-run after regenerating atlas.json:  node scripts/shard-atlas.mjs
//
// NOTE: the canonical eps/MAF/length-aware passenger filter still needs to land in
// build_atlas_data (separate python repo) with manuscript confirmation; this script does NOT
// transform the science, only the transport (it shards verbatim).

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const SRC = resolve(root, "public/data/atlas.json");
const OUT_DIR = resolve(root, "public/data/atlas");
const COHORT_DIR = resolve(OUT_DIR, "cohort");

const atlas = JSON.parse(readFileSync(SRC, "utf8"));

// Fresh output tree.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(COHORT_DIR, { recursive: true });

const indexCohorts = atlas.cohorts.map((c) => ({
  id: c.id,
  study: c.study,
  cohort: c.cohort,
  n_samples: c.n_samples,
  median_tmb: c.median_tmb,
  eps: c.eps,
  cbio: c.cbio,
  // counts only — no edges. Drives the combobox, Show-option counts, cross-model strip totals,
  // and the empty-state recovery, all before the per-cohort shard is fetched.
  bmrs: Object.fromEntries(
    Object.entries(c.bmrs).map(([bmr, dd]) => [
      bmr,
      { ME: { n_total: dd.ME.n_total }, CO: { n_total: dd.CO.n_total } },
    ]),
  ),
}));

const index = {
  bmrs: atlas.bmrs,
  bmr_label: atlas.bmr_label,
  cohorts: indexCohorts,
};

writeFileSync(resolve(OUT_DIR, "index.json"), JSON.stringify(index));

let maxBytes = 0;
for (const c of atlas.cohorts) {
  // The heavy payload: drivers + full per-bmr ME/CO edges (incl. n_total so a hydrated cohort
  // is self-consistent without the index).
  const shard = { drivers: c.drivers, bmrs: c.bmrs };
  const json = JSON.stringify(shard);
  maxBytes = Math.max(maxBytes, json.length);
  writeFileSync(resolve(COHORT_DIR, `${c.id}.json`), json);
}

const idxBytes = JSON.stringify(index).length;
const kb = (n) => (n / 1024).toFixed(1);
console.log(`wrote ${OUT_DIR}`);
console.log(`  index.json         ${kb(idxBytes)} KB (${index.cohorts.length} cohorts)`);
console.log(`  cohort/*.json      ${atlas.cohorts.length} files, max ${kb(maxBytes)} KB`);
