# AGENTS.md — DIALECT Atlas

Interactive companion to the DIALECT manuscript: candidate ME/CO gene-effect
interactions × **3 BMR models** (CBaSE, DIG, MutSigCV2), served as two immutable
releases: **K=500** (default; 32 TCGA cohorts; MutSigCV2 primary, BY `q ≤`) and
**K=100** (71 TCGA/MSK-IMPACT/MSK-CHORD cohorts; CBaSE primary, BH `q <`).

Public: `https://dialectcanceratlas.com` → Cloudflare Pages project
`dialect-cancer-atlas`. The public releases are indexable. Lives under the
dialect repo as `atlas/`; data is built from the parent package.

## Stack & commands

Vite + React 19 + TypeScript + **Tailwind v4** (tokens in `src/index.css`, no
tailwind.config) + small Radix/shadcn-style primitives. Hash-URL state. Static build →
Cloudflare Pages at the custom-domain root (`base: /`). GitHub Actions is CI-only;
Cloudflare's Git integration deploys `main`.

```bash
npm run dev       # localhost:5173 (base /)
npm run build     # custom-domain dist/ + deployment validation
npm run typecheck
npm run lint
npm test
npm run validate:data
npm run check
```

## Data

Generated, **not hand-edited**. Releases live at immutable, versioned paths under
`public/data/releases/`, listed in `src/features/atlas/release-catalog.json` (which
also names the default). Never modify or delete a published release; add a new one.
From the DIALECT repo (see its `AGENTS.md` for the full commands):

```bash
# Deterministic Fisher/DISCOVER/MEGSA/WeSME-WeSCO baselines on the same pair family.
PYTHONPATH=/path/to/DISCOVER/python \
  python -m analysis.build_atlas_baselines --profile k500 --jobs 6

# Assemble, self-verify, and validate the release (clean HEAD required).
python -m analysis.build_atlas_data --k 500 \
  --out atlas/public/data/releases/k500-2026-09-25 \
  --release-id k500-2026-09-25 --generated-at 2026-09-25T00:00:00Z
node atlas/scripts/validate-release.mjs
```

K=100 (schema 2.0.0) holds a manifest, index, data dictionary, and one compact JSON
table per cohort. K=500 (schema 3.0.0) holds one `cohort.json` per cohort plus
gzip-compressed little-endian columnar tables (`pairs`, one per background,
`baselines`); the site decodes them in `lib/columnar.ts`, materializes the ranked
head plus every row within the largest q cutoff, and reaches any other pair by
lookup. K=500 decisions come from the builder's exact log-q bits, never from
re-comparing rounded q. Types: `src/features/atlas/types.ts`.
Likely-passenger annotations live in the separately versioned
`public/data/annotations/likely-passengers-v1.json` sidecar. They are exact
event features (`_M`/`_N`) drawn from the count-ranked, non-OncoKB source lists;
never edit the immutable release to add UI annotations.

## Design locks (non-negotiable)

- **Warm, legible, and rounded:** beige light mode is the default, a warm charcoal
  dark mode is available from the header, Raleway is the UI face, and large type plus
  generous radii are the baseline. IBM Plex Mono is reserved for genes and statistics.
- **Color is semantic and restrained:** ME blue, CO ochre, and one support green.
- **Study first:** never choose a default cohort. Selection is two-stage: study, then
  cancer type. Always show the release cohort token alongside the full cancer name.
- **Result first:** Explore defaults to a two-lane ranked list with ME and CO always
  visible. The optional network uses the same candidate set, is direction balanced and
  bounded, and supports drag, hover/focus inspection, selection, and pair detail.
- **Candidates and calls stay distinct:** the default list exposes ranked candidates;
  `Significant only` applies the active strict q-value cutoff. Significant rows use a
  quiet tint, never a repeated icon or text badge. Empty significant sets stay honest
  and offer a one-step return to the ranked list.
- **Release-specific default background:** K=500 opens on MutSigCV2 (primary);
  cross-background "Overlap" is descriptive only and never a vote. K=100 opens on
  consensus: the default candidate set requires the exact pair and
  direction under CBaSE, DIG, and a real MutSigCV2 background. Exclude MutSig rows
  derived from CBaSE fallback features. Customize may independently lower the minimum
  BMRs identifying and significant; both default to three. Individual views use that
  model's q-value.
- **One threshold everywhere:** q presets are controlled in Customize, shared by
  Explore, Compare, network, and pair detail, and serialized in the hash URL with the
  release. K=100 calls use strict BH `q <`; K=500 calls use inclusive BY `q ≤`. Baseline
  methods use `q <`; MEGSA remains fixed at `p < 0.001` because that field is a p-value.
- **Scientific ranks stay direction-specific:** K=100 ranks ME by rho ascending and CO
  by LRT descending; K=500 ranks each direction by BY q, then p, then |rho|. Rows whose
  direction is unavailable are never listed as ME or CO. Preserve raw negative numerical LRT values, but show them as zero
  evidence. Do not apply an epsilon filter.
- **Progressive disclosure:** pair detail, BMR selection, and q cutoff belong in
  dialogs/drawers; methodology and provenance belong in Compare/About, not permanent
  prose. Cancer/cohort switching is the rounded Change action beside the cancer name.
- **Navigation order:** About, Explore, Compare, Contact. Pair rows with DIALECT evidence may
  open detail from Compare even when absent from the active Explore result set.
- **Shared page geometry:** Explore and Compare use `CohortHeader` and
  `ResultsToolbar`. Their title, cohort action, study/tumor pills, controls, and
  Customize placement stay aligned. Compare shows one direction at a time.
- **Network scope:** show the top 10 ranked candidates per direction before optional
  significance filtering. Connections terminate at node centers; preserve drag,
  hover/focus inspection, selection, and pair detail.
- **Likely-passenger highlighting is optional:** the Customize toggle shades exact
  event features from the published annotation sidecar. Never label these as genes or
  as significance calls.
- **Minimal text and motion.** Use short sentence-case copy, real buttons, visible focus,
  reduced-motion behavior, and mobile stacking. No playful research claims.
- Reuse `src/components/ui/*`; numbers use tabular figures and genes/stats use mono.

## Layout of code

```
src/features/atlas/   components, hooks, lib, types  (one feature)
src/components/ui/    shared primitives
src/lib/              utils, useHashState, motion
```

App composes only — logic lives in feature hooks/lib.

## Keep simpler, not more complex

Ahmed iterates until proud. Prefer deletions and consolidation over new surfaces.
