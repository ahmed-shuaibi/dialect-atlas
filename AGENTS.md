# AGENTS.md — DIALECT Atlas

Interactive companion to the DIALECT manuscript: candidate ME/CO gene-effect
interactions across **71 cohorts** (TCGA PanCan, MSK-IMPACT, MSK-CHORD) × **3 BMR
models** (CBaSE, DIG, MutSigCV2).

Public: `ahmed-shuaibi/dialect-atlas` → GitHub Pages. The public K=100 release is
indexable. Lives under the dialect repo as `atlas/`; data is built from the parent package.

## Stack & commands

Vite + React 19 + TypeScript + **Tailwind v4** (tokens in `src/index.css`, no
tailwind.config) + small Radix/shadcn-style primitives. Hash-URL state. Static build →
GH Pages (`base: /dialect-atlas/`). Set `ATLAS_BASE_PATH=/` for a custom domain.

```bash
npm run dev       # localhost:5173 (base /)
npm run build     # dist/ for Pages
npm run typecheck
npm run lint
npm test
npm run validate:data
npm run check
```

## Data

Generated, **not hand-edited**. The published data lives at the immutable,
versioned path `public/data/releases/k100-2026-08-26/`. From the DIALECT repo:

```bash
# Generate deterministic Fisher/DISCOVER/MEGSA/WeSME-WeSCO results first.
PYTHONPATH=/path/to/DISCOVER/python \
  python -m analysis.build_atlas_baselines --jobs 4

# Then assemble and validate the complete Atlas release.
python -m analysis.build_atlas_data \
  --out atlas/public/data/releases/k100-2026-08-26 \
  --baseline-root output/atlas_baselines/k100 \
  --generated-at 2026-08-26T00:00:00Z
node atlas/scripts/validate-release.mjs
```

The release contains a manifest, index, human-readable data dictionary, and one
complete compact JSON table per cohort. Types: `src/features/atlas/types.ts`.

## Design locks (non-negotiable)

- **Warm light only:** paper/beige surfaces, near-black text, crisp Inter type, and
  deliberate whitespace. IBM Plex Mono is reserved for genes and statistics.
- **Color is semantic and restrained:** ME blue, CO ochre, and one support green.
- **Cancer first:** never choose a default cohort. Selection is two-stage: cancer type,
  then the available study/cohort for that cancer.
- **Result first:** Explore defaults to a legible interaction network and offers a
  compact list from the same significant result set. Bound dense networks to a clearly
  labeled, direction-balanced top-ranked view; the progressive list exposes every pair.
- **Significance first:** no interaction appears merely because it ranked highly.
  Every visible result has `q < 0.01` under the active model.
- **All three BMRs by default:** the default is the exact pair and direction at
  `q < 0.01` under CBaSE, DIG, and a real MutSigCV2 background. Exclude MutSig rows
  derived from CBaSE fallback features. Individual-model views use that model's
  significant results. Empty sets stay empty; never substitute weaker evidence.
- **Scientific ranks stay direction-specific:** ME by rho ascending; CO by LRT
  descending. Preserve raw negative numerical LRT values, but show them as zero
  evidence. Do not apply an epsilon filter.
- **Progressive disclosure:** pair detail and BMR selection belong in dialogs/drawers;
  methodology and provenance belong in Compare/About, not permanent prose.
- **Navigation order:** About, Explore, Compare. Pair rows with DIALECT evidence may
  open detail from Compare even when absent from the active Explore result set.
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
