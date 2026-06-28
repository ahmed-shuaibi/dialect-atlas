# CLAUDE.md — DIALECT Atlas

Interactive companion site to the **DIALECT** manuscript (`raphael-group/dialect`): an atlas of
driver **mutual-exclusivity (ME)** / **co-occurrence (CO)** networks across **69 cancer cohorts**
(TCGA PanCan, MSK-IMPACT, MSK-CHORD) × **3 BMR models** (CBaSE, Dig, MutSigCV2).

Owner: Ahmed Shuaibi (PhD author). Public repo `ahmed-shuaibi/dialect-atlas`. **Pre-publication →
`noindex`** (robots meta in `index.html`); remove at publication.

## Stack
Vite + React 19 + TypeScript + **Tailwind v4** (`@tailwindcss/vite`, tokens in `src/index.css`,
no tailwind.config) + **shadcn/ui** (hand-vendored in `src/components/ui/`, Radix) + **Cytoscape.js**
(`cytoscape-fcose`) for networks. Hash-URL state. Static build → GitHub Pages.

## Commands
- `npm run dev` — preview at localhost:5173 (base `/`)
- `npm run build` — static `dist/` (base `/dialect-atlas/` in production; set in `vite.config.ts`)
- Deploy: push to `main` → `.github/workflows/deploy.yml` builds + publishes to GitHub Pages
  (**https://ahmed-shuaibi.github.io/dialect-atlas/**). Hosting may move to Ahmed's domain — if so,
  set `base: "/"`.
- Visual QA: no browser extension here; screenshot with Playwright via system Chrome
  (`npm i -D playwright` skip-download → `chromium.launch({channel:"chrome"})`; remove before commit).

## Data
`public/data/atlas.json` (~1.6 MB, committed) is generated, NOT hand-edited. Regenerate from the
DIALECT result CSVs in the main repo:
`python -m analysis.build_atlas_data --out ../dialect-atlas/public/data --k 50`.
Per cohort: top-K ME (ρ<0) + CO (ρ>0) gene-effect pairs (eps-filter + intra-gene exclusion), each
with ρ, LRT, τ₁₁, marginal driver probs, 2×2 contingency; plus `cbio` URL (TCGA only). Types in
`src/lib/atlas.ts`.

## Design rules (NON-NEGOTIABLE — Ahmed has strong taste; matches `shuaibi-portfolio`)
- **Dark-only**, near-black + dot-grid (masked behind data surfaces via `.surface`/`.canvas-surface`).
  Inter / Newsreader (serif headings) / IBM Plex Mono (genes, numbers, eyebrows).
- **Color is minimal.** The ONLY saturated color is the data encoding: ME `--me-color` (blue, solid),
  CO `--co-color` (amber, dashed). Teal `--brand` `#8ab2c0` only for focus/driver-nodes. Everything
  else grayscale. Elevation = solid border + `--elev-highlight` inset, never drop shadows.
- **Consolidate**: reuse the shared `ui/` components (Select, Tooltip, Popover, Command, Button,
  Badge) with near-defaults; don't invent bespoke variants. Controls are labeled dropdowns.
- **Minimal text. Minimal/no animation** (`fcose animate:false`; only subtle dropdown fades).
- Numbers `tabular-nums`; mono for gene symbols + stats. Info tooltips explain ρ/LRT/τ.

## Current state (v1, shipped)
Three dropdowns (Cohort combobox grouped by study / Background-rate model / Show ME-CO-Both),
one-line cross-model comparison caption, full-width Cytoscape network (hover-highlight, click-to-
select, legend), sortable table with header tooltips + **expandable 2×2 contingency row** (replaced
the old right-rail inspector). top-K fixed at 25.

## Open / next
- cBioPortal links are **TCGA-only** (reliable study IDs); add MSK once study IDs confirmed.
- Hosting move to a custom domain (then `base: "/"`).
- Ahmed iterates "until proud" — expect more rounds; keep it simpler/cleaner, not more complex.
