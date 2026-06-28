# DIALECT Atlas — Critique & Redesign Roadmap

## 1. Brutal verdict

The Atlas isn't broken at the pixel level — it's broken because **it leads with its worst data inside its weakest visualization and never tells you what you're looking at.** A cold reviewer lands on a force-directed graph that renders as two tiny hub-and-spoke "stars" stranded in 600px of dead black, gene labels at sub-readable 11px (dimmed to 7px), above a table whose first screen is `TTN_M:MUC16_M (ρ=+0.998)`, `HMCN1_M:SACS_M`, `RYR2_M` — textbook hypermutation/long-gene artifacts — while `_M`, ME, CO, ρ, LRT, and τ are defined nowhere. The chrome compounds it: an off-scale 26px serif h1 echoing the serif nav wordmark, spacing pulled from a hat (`pt-9 / mt-5 / mt-10 / gap-1.5`), data text at decoration-tier gray that fails WCAG AA, drop shadows that violate the owner's own elevation rule, zero responsive breakpoints, a 1.66MB JSON shipped up front. The code is clean and well-typed, but everything lives in a 198-line god-component, which only makes the fixes more expensive. The verdict "horrible" is correct, and the diagnosis is not "add polish" — it's "the page is architected to hide the science it exists to showcase."

## 2. Root problems (everything else is a symptom)

**R1 — Wrong primary surface. The hero should be the ranked table, not the graph.** Gene-interaction networks are scale-free; the verified BRCA/cbase top-25 graph is TP53 (deg 16) + TTN (deg 13) plus spokes — a star, not a topology you read. The HCI literature (Ghoniem/Fekete/Castagliola; Kobourov 2018) is decisive that above ~20 nodes a node-link diagram loses to a sorted table on every task except path-tracing, which is not a task here. Leading with the graph produces the void, the micro-labels, and the mobile collapse all at once. *Fix the altitude and ~4 critical findings dissolve.*

**R2 — The default view is dishonest by accident.** `d:'both'` + CO-sorted-by-LRT-desc surfaces ~1200 CO rows over ~176 ME rows, topped by long-gene passengers at ρ≈0.99. The first impression is a methodological red flag; the headline DIALECT result (ME, e.g. PIK3CA–TP53) is buried. A credibility failure, not an aesthetic one.

**R3 — No on-ramp. The tool assumes you've read the paper.** No dek, no glossary, `_M`/`_N` undefined, ρ/LRT/τ hidden behind a faint dotted underline, the 3-BMR story (the atlas's genuinely novel axis) reduced to a cryptic count line `CBaSE 1,197 · Dig 67 · MutSigCV2 3`. For reviewers who haven't read the manuscript, legibility *is* credibility — and there is none.

**R4 — No system: no type scale, no spacing grid, no responsive design, tokens contradicted by components.** Six ad-hoc font sizes, five gap sizes off the 4/8 grid, three radius scales, three elevation systems (the "never drop shadows" rule broken in `select/popover/tooltip`), data text in AA-failing 0.45 gray, zero breakpoints. The rhythm reads as accidental — which is why a sparse layout feels "unfinished" rather than "minimal."

**R5 — The product surfaces aren't accessible, and the structure makes change expensive.** The canvas is a screen-reader void with no keyboard path; primary table rows are mouse-only `<tr onClick>`; interactions (click-to-expand 2×2, table↔network cross-highlight) have zero affordance. All of it is fused into a 198-line `App.tsx` (fetch + URL-coerce + derivation + caption math + controls + layout), organized type-first instead of feature-first.

## 3. Findings by category (severity-ranked, deduped)

### CRITICAL

**C1 — Network renders as two stars in a black void.** *(Visual, UX, DataViz, Mobile)*
`NetworkView.tsx:155` hardcodes `h-[600px] w-full`; fcose `nodeRepulsion:8500 / idealEdgeLength:95 / gravity:0.2` (`:21`) drives the two components to opposite ends; `cy.fit(36)` can't fill a box far larger than the graph. **Principle:** whitespace frames content, it isn't a void; sparse surfaces shrink to content. **Fix (mostly resolved by R1 demotion):** `h-[600px]` → `h-[clamp(300px,70vh,560px)]`; auto-shrink to the graph's bounding box on sparse cohorts; `randomize:false` (deterministic per visit); lower `nodeRepulsion≈4500` / `idealEdgeLength≈65`, raise gravity; enable `packComponents`/`componentSpacing` so components pack side-by-side.

**C2 — Default view leads with hypermutation artifacts.** *(Visual, UX, DataViz, SciComm)*
`App.tsx:42` `d:'both'`, `:191` CO sorts LRT-desc → 24/25 top BRCA/cbase CO rows touch a long/passenger gene, led by `HMCN1_M:SACS_M` and `TTN_M:MUC16_M (ρ=+0.998)`. **Principle:** default to the interesting, honest signal — not the artifact. **Fix:** default `d:'ME'`; add an **"exclude likely-passenger genes" toggle, ON by default** (TTN, MUC16, HMCN1, RYR2, FLG, USH2A, CSMD3, LRP1B, PCLO, OBSCN, SYNE1, NEB, DST); when shown, **flag** those rows with a muted "likely length artifact" badge rather than hiding silently. Ideally push an eps/MAF/length-aware filter into `build_atlas_data` so artifacts don't consume the top-K before the UI.

**C3 — No first-visitor orientation; core jargon undefined.** *(UX, SciComm, Visual)*
Hero is a lone h1 (`App.tsx:92`); `_M`/`_N` defined nowhere (only two suffixes exist atlas-wide, `_M`×17,963 / `_N`×2,791); ME/CO/ρ/LRT/τ never glossed in plain language; the network strips the suffix (shows `TP53`) so table and graph *disagree on gene identity*. **Principle:** every domain term gets a one-glance definition. **Fix:** a 2-3 sentence Inter dek under the h1 in a ~680px column ("DIALECT infers driver-gene dependencies corrected for background mutation rate; blue/solid = mutually exclusive, amber/dashed = co-occurring"); define `_M = somatic point/indel event` (confirm `_N`'s exact meaning from the manuscript before shipping) inline at first appearance; make network labels match the table.

**C4 — Force-directed graph is the wrong primary viz.** *(DataViz, UX)* — this is **R1**.
**Fix:** invert the page. Ranked table = primary full-width surface; network = secondary/optional "topology" panel defaulting to a **focus+context ego view** seeded on the top-ranked ME pair (reuse `closedNeighborhood()` from `NetworkView.tsx:121` to drive *initial* state, not just hover), expandable on click or table-row selection.

**C5 — `muted-foreground` (2.82:1) used as body text everywhere — fails WCAG AA.** *(Accessibility, Visual)*
`index.css:26` oklch(0.45), self-commented "decoration only," is applied to control labels, the cross-model caption, the N/TMB strip, all stat headers, contingency labels, footer, empty-state. The AA-safe `--muted-foreground-strong` (0.62 = 5.77:1) already exists, unused in most spots. **Fix:** swap `text-muted-foreground → -strong` for every instance read as content; reserve 0.45 strictly for `·` separators and non-text decoration; consider 0.66+ for the smallest labels.

**C6 — Network is a screen-reader void with no keyboard operability.** *(Accessibility)*
Bare `<canvas>` (`:155`), no role/aria-label/text alt (WCAG 1.1.1); all interaction is `cy.on('mouseover'/'tap')` with no keyboard path (WCAG 2.1.1). **Fix:** make the table the accessible source of truth; give the canvas `role="img"` + summarizing `aria-label`; ensure every pair-level interaction is reachable via the table (see H4). R1 demotion resolves this structurally.

### HIGH

**H1 — Node labels are unreadable micro-text.** *(Visual, DataViz, SciComm, A11y, Mobile)* `NetworkView.tsx:73` font-size 11, `:80` min-zoomed 7. **Fix:** resting label 13px mono, min-zoomed ≥10, node-size range 22-60 → ~28-66, stronger dark-halo outline; with the ego view, label only the focal hub + first-degree neighbors so labels never collide.

**H2 — App.tsx is a 198-line god-component.** *(Architecture)* Fuses fetch tri-state (`:40-47`), inline hash coercion (`:54-56`), derivation memo (`:52-64`), caption math (`:151-161`), controls (`:97-148`), layout. **Fix:** extract `useAtlas()` (data lifecycle w/ abort guard), `useAtlasView()` (typed `parseView(hash, atlas)` + derivation), `<AtlasControls>`, `<CrossModelStrip>`. App → ~60 lines of composition.

**H3 — shadcn Button exists but is never imported; every button is hand-rolled.** *(Components)* `button.tsx` has outline/icon variants, 0 imports; `IconBtn` (`NetworkView.tsx:170`) and the combobox trigger (`CohortCombobox.tsx:43`) are raw `<button>`s that already drift (`bg-card/80` vs `bg-white/[0.04]` vs `bg-white/[0.03]`). **Fix:** `IconBtn` → `<Button variant="outline" size="icon">`; combobox trigger → `<Button variant="outline">`. Inherits focus ring + hover token + radius from one source.

**H4 — Table rows & sort headers are mouse-only; interactions undiscoverable.** *(UX, A11y, Components)* `<tr onClick>` / `<th onClick>` (`ResultTable.tsx:48,171`) — no tabIndex/role/onKeyDown/aria-expanded/aria-sort. Click-to-expand 2×2, sort, and table↔network cross-highlight have zero affordance. **Fix:** explicit expand chevron per row (rotates on open) + a one-line helper ("Select a pair to see its 2×2 contingency / highlight it in the network"); sort headers as real `<button>`s with `aria-sort`; keyboard-operable rows (`role="button"`, `tabIndex=0`, Enter/Space, focus ring); brand-teal ring on the active row mirrored to the network.

**H5 — Cross-model comparison reduced to a cryptic count line.** *(DataViz, SciComm, UX)* `App.tsx:151-161`. The 3-BMR robustness story is the atlas's most novel axis; `CBaSE 1,197 · Dig 67 · MutSigCV2 3` reads as a debug stat and invites the *opposite* read (method unstable). **Fix:** a compact 3-up small-multiples comparison (three mini ranked lists or a presence matrix) + a **"replicated in N/3 models"** badge per row, highlighting pairs robust across all three.

**H6 — Drop shadows violate the non-negotiable elevation rule.** *(Components)* `select.tsx:38`, `popover.tsx:18` `shadow-[0_16px_48px_...]`, `tooltip.tsx:18` `shadow-[0_8px_24px_...]`. CLAUDE.md mandates border + `--elev-highlight` inset, zero shadows. **Fix:** replace shadow utilities with `border-border` + `box-shadow: var(--elev-highlight)` (add a single `--elev-overlay` inset token only if popovers genuinely need separation).

**H7 — No type scale; ad-hoc spacing soup.** *(Visual, Components)* Six raw sizes (`text-[26px]`, `text-[19px]`, 13, 12, 11, 10), no ramp; spacing `pt-9 / pb-6 / mt-4 / mt-5 / mt-10 / gap-1.5 / gap-3 / gap-4` off any 4/8 grid; serif h1 stacked under serif nav wordmark with no eyebrow. **Fix:** `@theme` ramp (12 eyebrow / 13 meta / 16 body / 25 h2 / 31 h1); collapse spacing to tokens (48 section, 24 control-row, 16 caption, 8 label→input, 64 page-top, kill gap-1.5/mt-5/mt-10); mono eyebrow above the h1; nav wordmark in mono/sans so only one serif voice owns the heading zone.

**H8 — No responsive design — zero breakpoints.** *(Mobile)* `grep -c` returns 0; the 390px view is accidental flex-wrap of a 1400px layout. **Fix:** controls stack `w-full` below ~640px; N/TMB strip onto its own labeled row; table-first ordering; cap network height lower on mobile (`clamp(300px,55vh,560px)`).

**H9 — Stat definitions discoverable only via a faint dotted underline; LRT lacks units/threshold.** *(SciComm)* Defs exist (`ResultTable.tsx:11-36`) but the affordance is a dotted underline on an 11px header; the LRT gloss never states null/df/p-mapping or cutoff; node-size encoding (marginal driver prob) is unlabeled. **Fix:** visible info glyph on each stat header; state LRT interpretation (~χ² 1df → p) + any paper cutoff; document network encodings in the legend ("edge width = |ρ|, node size = gene marginal driver prob, solid = ME / dashed = CO").

### MEDIUM

**M1 — 6-column table overflows on mobile with no scroll cue.** *(Mobile)* `overflow-auto` + `whitespace-nowrap`, co-mut already clipped at 390px. **Fix:** below ~640px collapse low-priority columns (τ/co-mut behind the expand row) keeping Gene pair + Type + ρ + LRT, or use stacked cards; add a scroll-shadow affordance.

**M2 — 1.66MB atlas.json loaded up front; Cytoscape in the main bundle.** *(Mobile/Perf, Architecture)* 1.66MB (290KB gz); a visitor views one cohort/model at a time. Cytoscape+fcose imported eagerly at `NetworkView.tsx:1-3`. **Fix:** shard into a small index (cohort list + counts, <30KB) + per-cohort files fetched on selection (the build script already emits per-cohort structure); `React.lazy` the NetworkView so Cytoscape ships in its own chunk + `manualChunks`. Pairs with table-first ordering.

**M3 — No reading-measure column; data text too small/dim against off-scale h1.** *(Visual)* Everything sits in `max-w-[1400px]` with no inner ~680px text column; comparison caption/meta at `text-xs` 0.45 gray. **Fix:** wrap eyebrow/h1/dek/caption in a left-aligned ~680px (60-75ch) column; only network + table go full-width; promote data-bearing text to 13px + strong gray.

**M4 — ME/CO carried by hue alone in the table; 1.26:1 grayscale-indistinct pair.** *(DataViz, A11y, Components)* Network has solid/dashed redundancy (good); the table Type cell is a colored dot; `#4ea3df`/`#e9a13b` is not the Wong-safe pair. **Fix:** mirror solid/dashed swatch + signed ρ into the table and legend; wire the **already-existing-but-unused** `badge.tsx` me/co variants instead of bespoke colored-dot markup; sim-check under deuteranopia.

**M5 — N/TMB/cBioPortal strip undefined, AA-failing, silently TCGA-only.** *(UX, A11y)* `App.tsx:130-147`. **Fix:** label/tooltip N (sample count) and TMB (median, mut/Mb); for non-TCGA cohorts keep a disabled+explained cBioPortal slot so its absence isn't a mystery; bump to strong gray.

**M6 — Empty-state is dead-end prose.** *(UX)* `App.tsx:165-171` says "try another model" while `bmrCounts()` already knows which models have data. **Fix:** clickable chips ("CBaSE has 176 ME pairs →") so recovery is one click.

**M7 — Type-first folders; domain code scattered.** *(Architecture)* Domain components sit in `src/components/` beside `ui/*`; domain model in `src/lib/atlas.ts` (which also couples types to Cytoscape `ElementDefinition`). **Fix:** `src/features/atlas/{components,lib (atlas-data + atlas-transform),hooks,types.ts}` with a small named-export `index.ts` (no glob barrel). Keep URL-in-hash. **Do not** invent multiple features or generalize single-use NetworkView/ResultTable.

**M8 — Three radius scales; off-token grays; one-off control widths.** *(Components)* radius-xl (surfaces) vs rounded-lg (overlays) vs rounded-md (controls); stray `#0a0a0a`, inline `#8ab2c0`/`#2b3640`; `w-[180px]/w-[200px]/w-[280px]/w-[340px]`. **Fix:** two radius tiers (container = lg, interactive = md); route grays through tokens/`getComputedStyle`; one shared control-width token.

### LOW

**L1 — Two dead deps shipped** (`motion`, `@radix-ui/react-toggle-group`) → `npm uninstall`; audit `tw-animate-css`. *(Architecture, Perf)*
**L2 — Single off-scale h1, no h2 section headings; nav brand is an `<a>` not in heading tree** → promote Network / Ranked-dependencies eyebrows to styled `<h2>`. *(A11y)*
**L3 — Network IconBtns named only via `title`; contingency table has no caption/`scope`** → `aria-label` + `<caption>` + `<th scope>`. *(A11y)*
**L4 — Hash state shareable but invisible; selected pair not in hash; invalid hash coerced silently** → "copy link" button, persist selection in hash, one-time toast on coercion. *(UX)*
**L5 — Loading skeleton hardcodes the 600px void, causes CLS** → mirror real layout blocks, share the height token with NetworkView. *(Perf)*
**L6 — `maximum-scale=5` in viewport; unused me/co badge variants; canvas controls use gap-1.5** → drop the scale cap; use or delete the badge variants; snap to 8/12px. *(A11y, Components)*

## 4. Redesign direction — the north star

**Concept: "instrument-grade editorial dark."** Linear's quiet command-deck density × Stripe's tabular-mono precision × OWID/Pudding's progressive on-ramp. Matches `shuaibi-portfolio`. The page is a *ranked-evidence instrument with an optional topology lens* — not a graph with a table appended.

**Layout (the inversion).** Wide shell capped at one container token (~1280-1400px):
- **Editorial column (~680px, 60-75ch, left-aligned):** mono eyebrow → h1 (25 or 31px) → 2-3 sentence dek → compact legend with `_M`/`_N` + ME/CO glosses.
- **Controls row (full width, 24px gaps):** labeled shadcn dropdowns at one shared trigger width — Cohort combobox / BMR model / Show (default ME). Each Show option carries a live count.
- **Cross-model strip:** 3-up small multiples (not a count line).
- **Ranked table = the hero, full width, dense** (rows 36-40px, tabular-nums, right-aligned numerics, in-cell diverging ρ tint/mini-bar blue-neg/amber-pos, expandable 2×2 row, "N/3 models" robustness badge, artifact flag).
- **Topology panel = secondary**, collapsible/below, ego view seeded on the top ME pair, height `clamp(300px,70vh,560px)`, shrink-to-graph. On mobile: behind a "show topology" disclosure.

**Type scale** (`@theme`, ratio 1.25, ≤5 sizes): 12 eyebrow/label (mono, 0.22em) · 13 meta/data · 16 body · 25 h2 · 31 h1. Line-heights snapped to 4px (body 24/1.5, headings 1.15, mono 1.4). Inter (UI/body), Newsreader (headings only), IBM Plex Mono + `tabular-nums` for **all** genes/stats/eyebrows.

**Spacing** (4/8 grid): 64 page-top · 48 section · 24 control-row · 16 caption · 8 label→input · 4 intra-component only. Kill every `mt-5/mt-10/gap-1.5`.

**Color** (discipline enforced): one neutral ramp on near-black (#050505) + exactly two data hues (ME `#4ea3df` solid, CO `#e9a13b` dashed) + one teal `#8ab2c0` for focus/driver only. **All ME/CO meaning redundantly encoded** (solid/dashed line + signed ρ + text), never hue alone — survives deuteranopia and a grayscale PDF. All content text ≥4.5:1 via `--muted-foreground-strong`.

**Elevation:** 1px solid border + `--elev-highlight` inset, single radius token (two tiers), zero drop shadows — everywhere, including the three overlays. Motion near-zero: `fcose animate:false`, 150-300ms opacity/transform fades only, `prefers-reduced-motion` honored.

**Dataviz decision: keep Cytoscape, demote it.** The ego/focus+context view is genuinely useful for one pair's neighborhood and is already wired — but it stops being the hero. The sorted table is the credibility surface and the accessible source of truth; the graph is the optional lens. (A matrix view is over-engineering at this scale — the table already wins.)

**Onboarding a newcomer:** dek (always visible, ~65ch) → inline first-use definitions for `_M`/ME/CO → visible info glyphs on every stat header (ρ/LRT/τ, with LRT's null/df/p stated) → counts on Show options so the user sees data shape before choosing → actionable empty-states.

**Surfacing signal over noise:** default `d:'ME'`; passenger-gene exclusion ON by default with a visible badge on flagged rows; CO down-ranked relative to ME; eps/MAF/length filter pushed into `build_atlas_data` so the top-K is clean at the source.

**Architecture (Bulletproof-React-aligned, scaled to one feature):**
```
src/
  app/            App.tsx (~60 lines: TooltipProvider + SiteNav + useAtlasView + components + Footer)
  features/atlas/
    components/   NetworkView, NetworkLegend, ResultTable, CohortCombobox, AtlasControls, CrossModelStrip, Field
    lib/          atlas-data.ts (loadAtlas)  ·  atlas-transform.ts (buildElements/tableRows/bmrCounts + constants)
    hooks/        useAtlas (lifecycle)  ·  useAtlasView (typed parseView + derivation)
    types.ts      Bmr/Direction/DirFilter/Edge/DirData/Cohort/Atlas (zero deps)
    index.ts      explicit named exports only
  components/ui/  unchanged shared primitives
  lib/            utils.ts, useHashState.ts
```
One `import/no-restricted-paths` lint rule (app not importable by features; ui not importable from features) + vitest on the three pure transforms (dedup, top-K, ME-wins-ties, counts). One feature folder — do not over-engineer.

## 5. Prioritized roadmap

### Phase 0 — Credibility & honesty (do first; near-zero code, highest impact)
- Default `d:'both'` → `d:'ME'` `[S]`
- Passenger-gene exclusion toggle, ON by default, with "likely length artifact" badge on flagged rows `[M]`
- Dek under h1 + `_M`/`_N`/ME/CO glosses in the legend; visible info glyph on ρ/LRT/τ headers with LRT interpretation `[M]`
- Swap `text-muted-foreground → -strong` everywhere it's content (AA) `[S]`

### Phase 1 — The void & legibility (kill the "horrible")
- Invert IA: ranked table primary/full-width, network secondary/optional `[M]`
- Network: `h-[600px]` → `clamp`, shrink-to-graph, `randomize:false`, retune fcose to pack, ego-view default seeded on top ME pair `[M]`
- Node labels 13px mono / min-zoomed ≥10 / bigger nodes / stronger halo `[S]`
- Replace count line with 3-up cross-model small multiples + "N/3 models" row badge `[M]`

### Phase 2 — System: type, spacing, tokens, elevation
- `@theme` type ramp + spacing tokens; kill all arbitrary px (`text-[26px]`, `h-[600px]`, `w-[180px/200px]`, `max-w-[1400px]`); ~680px editorial column `[M]`
- Remove drop shadows from select/popover/tooltip → border + inset `[S]`
- Two radius tiers; route stray grays through tokens; one control-width token `[S]`
- Mono eyebrow above h1; nav wordmark off-serif `[S]`

### Phase 3 — Interaction, a11y, mobile
- Real `<button>` sort headers (`aria-sort`); keyboard-operable rows (`role`, `tabIndex`, Enter/Space, `aria-expanded`, focus ring); explicit expand chevron + helper line `[M]`
- Delete `IconBtn`/raw combobox trigger → shadcn `Button`; `aria-label` on canvas controls; canvas `role="img"`+label; contingency `<caption>`/`<th scope>` `[M]`
- Responsive pass: stacked controls, table column collapse/cards below 640px, scroll affordance, mobile network height + disclosure `[M]`
- Actionable empty-state chips from `bmrCounts`; counts on Show options; copy-link + selection-in-hash `[M]`

### Phase 4 — Architecture & perf (makes future iteration cheap)
- Extract `useAtlas` / `useAtlasView` (typed `parseView`) / `<AtlasControls>` / `<CrossModelStrip>`; App → ~60 lines `[M]`
- Restructure to `features/atlas/{components,lib,hooks,types}` + minimal `index.ts` `[M]`
- Shard atlas.json into index + per-cohort files; `React.lazy` NetworkView + `manualChunks` for Cytoscape; fix skeleton geometry/CLS `[L]`
- `npm uninstall motion @radix-ui/react-toggle-group` (verify `tw-animate-css`); add ESLint boundary rule + vitest on the 3 pure transforms `[S]`

### Phase 5 — Source-level data hygiene (optional, strongest fix for R2)
- eps/MAF/length-aware artifact filter in `build_atlas_data --k` so the top-K is clean before the UI; confirm `_N`'s exact biological meaning from the manuscript before shipping its gloss `[M]`

**Relevant files:** `src/App.tsx` (god-component, defaults `:42`/`:191`, h1 `:92`, skeleton `:79`, caption `:151`) · `src/components/NetworkView.tsx` (`:21` fcose, `:73`/`:80` labels, `:155` h-[600px], `:170` IconBtn) · `src/components/ResultTable.tsx` (`:48`/`:171` mouse-only, `:11-36` defs) · `src/components/ui/{select,popover,tooltip}.tsx` (drop shadows) · `src/index.css` (tokens, `:26` muted-foreground) · `public/data/atlas.json` (1.66MB) · `package.json` (`:18`/`:26` dead deps).