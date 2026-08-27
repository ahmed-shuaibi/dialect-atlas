# AGENTS.md — DIALECT Atlas

Interactive companion to the DIALECT manuscript: candidate ME/CO gene-effect
interactions across **71 cohorts** (TCGA PanCan, MSK-IMPACT, MSK-CHORD) × **3 BMR
models** (CBaSE, DIG, MutSigCV2).

Public: `ahmed-shuaibi/dialect-atlas` → GitHub Pages. The public K=100 release is
indexable. Lives under the dialect repo as `atlas/`; data is built from the parent package.

## Stack & commands

Vite + React 19 + TypeScript + **Tailwind v4** (tokens in `src/index.css`, no
tailwind.config) + small Radix/shadcn-style primitives. Hash-URL state. Static build →
GH Pages (`base: /dialect-atlas/`; set `base: "/"` if moved to a custom domain).

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

- **Warm light only:** paper/beige surfaces, near-black text, large Montserrat type, and
  generous whitespace. IBM Plex Mono is reserved for genes and statistics.
- **Color is semantic and restrained:** ME blue, CO ochre, and one support green.
- **Cancer first:** never choose a default cohort. The first screen foregrounds one
  oversized searchable cancer/cohort choice.
- **Result first:** simultaneous ME and CO ranked plots are the primary visual. Do not
  restore Cytoscape or make a generic network the hero.
- **All three BMRs by default:** exact pair and direction consensus across CBaSE, DIG,
  and MutSigCV2. Show FDR support separately; strict consensus is `q < 0.01` in all 3.
- **Scientific ranks stay direction-specific:** ME by rho ascending; CO by LRT
  descending. Preserve raw negative numerical LRT values, but show them as zero
  evidence. Do not apply an epsilon filter.
- **Progressive disclosure:** pair detail, BMR selection, strict mode, methodology, and
  provenance belong in dialogs/drawers or the Compare/About views, not permanent prose.
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
