# AGENTS.md — DIALECT Atlas

Interactive companion to the DIALECT manuscript: candidate ME/CO gene-effect
interactions across **71 cohorts** (TCGA PanCan, MSK-IMPACT, MSK-CHORD) × **3 BMR
models** (CBaSE, DIG, MutSigCV2).

Public: `https://dialectcanceratlas.com` → Cloudflare Pages project
`dialect-cancer-atlas`. The public K=100 release is indexable. Lives under the
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
- **All three BMRs by default:** the default candidate set requires the exact pair and
  direction under CBaSE, DIG, and a real MutSigCV2 background. Exclude MutSig rows
  derived from CBaSE fallback features. Customize may independently lower the minimum
  BMRs identifying and significant; both default to three. Individual views use that
  model's q-value.
- **One threshold everywhere:** q presets are controlled in Customize, shared by
  Explore, Compare, network, and pair detail, and serialized in the hash URL. Calls use
  strict `<`; MEGSA remains fixed at `p < 0.001` because that release field is a p-value.
- **Scientific ranks stay direction-specific:** ME by rho ascending; CO by LRT
  descending. Preserve raw negative numerical LRT values, but show them as zero
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
