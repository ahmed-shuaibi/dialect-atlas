# DIALECT Atlas k500-2026-09-25

Complete K=500 release for 32 TCGA PanCancer Atlas cohorts, matching the
tested family of the DIALECT manuscript revision. MSK-IMPACT and MSK-CHORD cohorts
were not fitted at K=500 and remain in the K=100 release (`k100-2026-08-26`).

## Files

- `manifest.json`: analysis contract (the frozen revision reporting rule), encoding,
  coverage, and provenance with exact source hashes.
- `index.json`: cohort metadata, per-model and baseline summaries, and hashes.
- `cohorts/TCGA__<cohort>/cohort.json`: the ordered 500-feature axis, drivers, enums,
  and a record (rows, column layout, byte counts, SHA-256 of compressed and raw bytes)
  for each binary table.
- `cohorts/TCGA__<cohort>/pairs.bin.gz`: every tested pair as feature-axis indices
  (`a < b`) plus observed contingency counts.
- `cohorts/TCGA__<cohort>/dialect-{mutsig,cbase,dig}.bin.gz`: every fitted pair
  for one background model, row-aligned to `pairs`.
- `cohorts/TCGA__<cohort>/baselines.bin.gz`: Fisher, DISCOVER, MEGSA, and WeSME/WeSCO
  on the same pair family, row-aligned to `pairs`.

## Encoding

Tables are gzip-compressed. Decompressed, each column is stored contiguously and
little-endian at the byte offset listed in `cohort.json`; float64 columns precede
uint32, uint16, and uint8 columns, so every offset is aligned to its item size. NaN
encodes null (for example `rho` where the effect is not identifiable). `direction`
and `identifiability` are codes into `cohort.json` `enums`. `by_decisions` and
`bh_decisions` are bit masks: bit i is set when `log q <= log t` for the i-th value
of `decision_thresholds` (0.001, 0.005, 0.01, 0.05).

## DIALECT inference (frozen revision rule)

Each cohort tests every unordered pair of its frozen 500-feature axis, excluding
same-gene missense/nonsense pairs. For each background model separately, `p` is the
chi-square(1) profile-LRT probability when the pair effect is identifiable
(`full-affine-rank`) and 1 otherwise. Benjamini-Yekutieli over the complete
within-cohort family is primary; Benjamini-Hochberg is a nominal sensitivity.
Decisions use natural-log q-values, inclusively. MutSigCV2 is the only inferential
background: an `MutSigCV2 BY q <= 0.01` crossing is a rejection. CBaSE and DIG
crossings are descriptive continuity and sensitivity comparisons, and agreement
across backgrounds is descriptive, not an inferential vote. Direction is the rho sign
after a rejection; rejections without a defined sign are kept in the family and
excluded from ME/CO lists. This rule was calibrated before any association output
was read (two-stage fitted-null confirmation, total familywise error 0.05); the
calibration is a finite-scenario stress test, not a formal uniform FDR proof.

`rank` orders each background's ME and CO rows by BY log q, then log p, then |rho|
(descending), then pair order. Values are the sealed revision postprocess outputs
verbatim, and per-cohort crossing counts equal the published Table S5.

## Comparison methods

Fisher, DISCOVER, WeSME, and WeSCO use direction-specific BH `q < 0.01`; MEGSA is
ME-only with `p < 0.001`. DISCOVER q-values are recomputed with BH over exactly this
pair family. See `manifest.json` for seeds and versions.
