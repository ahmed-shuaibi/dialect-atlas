# AGENTS.md — DIALECT Atlas

Interactive companion to the DIALECT manuscript: ME/CO driver networks across **69 cohorts** (TCGA PanCan, MSK-IMPACT, MSK-CHORD) × **3 BMR models** (CBaSE, Dig, MutSigCV2).

Public: `ahmed-shuaibi/dialect-atlas` → GitHub Pages. **Pre-publication → `noindex`** (robots meta in `index.html`); remove at publication. Lives under the dialect repo as `atlas/`; data is built from the parent package.

## Stack & commands

Vite + React 19 + TypeScript + **Tailwind v4** (tokens in `src/index.css`, no tailwind.config) + hand-vendored **shadcn/ui** + **Cytoscape.js** (`cytoscape-fcose`). Hash-URL state. Static build → GH Pages (`base: /dialect-atlas/`; set `base: "/"` if moved to custom domain).

```bash
npm run dev       # localhost:5173 (base /)
npm run build     # dist/ for Pages
npm run typecheck
npm run lint
```

## Data

Generated, **not hand-edited**. From the DIALECT repo:

```bash
# from dialect repo root:
python -m analysis.build_atlas_data --out atlas/public/data --k 50
```

Sharded under `public/data/atlas/` (index + per-cohort JSON). Types: `src/features/atlas/types.ts`.

## Design locks (non-negotiable)

Matches portfolio taste (`ahmedshuaibi/`):

- **Dark-only**, near-black + dot-grid. Inter / Newsreader (serif headings) / IBM Plex Mono (genes, numbers, eyebrows).
- **Color is minimal.** Only data hues: ME `--me-color` (blue, solid), CO `--co-color` (amber, dashed). Teal `--brand` `#8ab2c0` for focus/driver only. Everything else grayscale.
- **Elevation** = solid border + `--elev-highlight` inset — **never drop shadows**.
- **Minimal text. Minimal motion** (`fcose animate:false`; subtle dropdown fades only).
- **One primary control:** ⌘K / `/` cohort command (`AtlasCommand`); model + direction as segments inside it. Removable chips for non-defaults.
- **Result-first:** network is the hero for the current cohort; table is secondary ranked evidence. Progressive disclosure for pair detail (popover), not permanent glossaries.
- Reuse `src/components/ui/*` near-defaults; don't invent bespoke variants.
- Numbers `tabular-nums`; mono for gene symbols + stats. Content text uses AA-safe muted tokens (`--muted-foreground` is decoration-only).

## Layout of code

```
src/features/atlas/   components, hooks, lib, types  (one feature)
src/components/ui/    shared primitives
src/lib/              utils, useHashState, motion
```

App composes only — logic lives in feature hooks/lib.

## Keep simpler, not more complex

Ahmed iterates until proud. Prefer deletions and consolidation over new surfaces.
