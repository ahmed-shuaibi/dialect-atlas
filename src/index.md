---
toc: false
---

# DIALECT Atlas

Interactive atlas of **driver mutual-exclusivity (ME) and co-occurrence (CO) networks**
inferred by [DIALECT](https://github.com/raphael-group/dialect) across **69 cancer cohorts**
(TCGA, MSK-IMPACT, MSK-CHORD) and **three background-mutation-rate (BMR) models** —
CBaSE, Dig, and a sample-specific MutSigCV2 model. Pick a cohort and a BMR model below; toggle
the BMR to see how the dependency network changes (the cross-BMR robustness story).

```js
const atlas = FileAttachment("data/atlas.json").json();
```

```js
const cohorts = atlas.cohorts;
const cohortById = new Map(cohorts.map((c) => [c.id, c]));
const fmtCohort = (id) => {
  const c = cohortById.get(id);
  return `${c.cohort} — ${c.study} (N=${c.n_samples.toLocaleString()})`;
};
```

```js
const cohortId = view(
  Inputs.select(
    cohorts.map((c) => c.id),
    {label: "Cohort", format: fmtCohort, value: "TCGA__BRCA", width: 360}
  )
);
```

```js
const bmr = view(
  Inputs.radio(atlas.bmrs, {
    label: "BMR model",
    format: (b) => atlas.bmr_label[b],
    value: "cbase"
  })
);
const direction = view(
  Inputs.radio(["both", "ME", "CO"], {
    label: "Interaction",
    format: (d) => ({both: "Both", ME: "Mutual exclusivity", CO: "Co-occurrence"}[d]),
    value: "both"
  })
);
const topk = view(
  Inputs.range([3, 50], {label: "Top-K per type", step: 1, value: 15})
);
```

```js
const rec = cohortById.get(cohortId);
```

<div class="card" style="margin-top:0.5rem;">

```js
// Cross-BMR comparison: ME/CO counts for this cohort under all three models.
html`<div style="display:flex; gap:2rem; flex-wrap:wrap; align-items:baseline;">
  <div><b>${rec.cohort}</b> · ${rec.study} · N=${rec.n_samples.toLocaleString()} ·
       median TMB ${rec.median_tmb} · ε=${rec.eps}</div>
  <table style="border-collapse:collapse; font-size:0.85rem;">
    <tr><th style="text-align:left; padding:0 .8rem;">BMR model</th>
        <th style="padding:0 .8rem; color:#d62728;">ME pairs</th>
        <th style="padding:0 .8rem; color:#17a2b8;">CO pairs</th></tr>
    ${atlas.bmrs.map((b) => {
      const sel = b === bmr;
      const me = rec.bmrs[b]?.ME.n_total ?? "—";
      const co = rec.bmrs[b]?.CO.n_total ?? "—";
      return html`<tr style="${sel ? "font-weight:700; background:var(--theme-background-alt);" : ""}">
        <td style="padding:0 .8rem;">${atlas.bmr_label[b]}${sel ? " ◀" : ""}</td>
        <td style="text-align:center;">${me}</td>
        <td style="text-align:center;">${co}</td></tr>`;
    })}
  </table>
</div>`
```

</div>

```js
import cytoscape from "npm:cytoscape@3.30.2";
import fcose from "npm:cytoscape-fcose@2.2.0";
cytoscape.use(fcose);
```

```js
// Build Cytoscape elements: base-gene nodes (size ~ marginal driver prob, gold = OncoKB
// driver) and dedup'd ME/CO edges (red = ME, teal = CO, width ~ |rho|). ME wins ties.
function buildElements(rec, bmr, direction, topk) {
  const b = rec.bmrs[bmr];
  if (!b) return {nodes: [], edges: []};
  const dirs = direction === "both" ? ["ME", "CO"] : [direction];
  const driverSet = new Set(rec.drivers);
  const nodeWeight = new Map();
  const seen = new Set();
  const edges = [];
  for (const d of dirs) {
    for (const e of (b[d]?.edges ?? []).slice(0, topk)) {
      const key = [e.a, e.b].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({data: {id: key, source: e.a, target: e.b, kind: d, w: Math.abs(e.rho)}});
      nodeWeight.set(e.a, Math.max(nodeWeight.get(e.a) ?? 0, e.ta));
      nodeWeight.set(e.b, Math.max(nodeWeight.get(e.b) ?? 0, e.tb));
    }
  }
  const nodes = [...nodeWeight].map(([g, w]) => ({data: {id: g, w, driver: driverSet.has(g)}}));
  return {nodes, edges};
}

const CY_STYLE = [
  {selector: "node", style: {
    "label": "data(id)", "font-size": 11, "font-weight": "bold",
    "text-valign": "center", "text-halign": "center", "color": "#15202b",
    "background-color": (e) => (e.data("driver") ? "#ffe08a" : "#e4e8ec"),
    "border-color": "#1a1a1a", "border-width": 1.5,
    "width": (e) => 24 + 80 * Math.min(e.data("w"), 0.6),
    "height": (e) => 24 + 80 * Math.min(e.data("w"), 0.6)
  }},
  {selector: "edge", style: {
    "line-color": (e) => (e.data("kind") === "ME" ? "#d62728" : "#17a2b8"),
    "width": (e) => 1.5 + 9 * Math.min(e.data("w"), 0.5),
    "curve-style": "straight", "opacity": 0.85
  }}
];
```

```js
const network = (() => {
  const div = document.createElement("div");
  div.style.cssText =
    "width:100%; height:560px; border:1px solid var(--theme-foreground-faintest);" +
    "border-radius:10px; background:var(--theme-background-alt); overflow:hidden;";
  const {nodes, edges} = buildElements(rec, bmr, direction, topk);
  if (!nodes.length) {
    div.style.cssText += "display:flex; align-items:center; justify-content:center; color:var(--theme-foreground-muted);";
    div.textContent = `No ${direction === "both" ? "ME/CO" : direction} dependencies for ${rec.cohort} under ${atlas.bmr_label[bmr]}.`;
    return div;
  }
  requestAnimationFrame(() => {
    const cy = cytoscape({
      container: div,
      elements: {nodes, edges},
      style: CY_STYLE,
      layout: {name: "fcose", animate: false, quality: "default", padding: 28,
               nodeRepulsion: 9000, idealEdgeLength: 95},
      wheelSensitivity: 0.2,
      minZoom: 0.2, maxZoom: 3
    });
    invalidation.then(() => cy.destroy());
  });
  return div;
})();
display(network);
```

<div style="font-size:0.85rem; color:var(--theme-foreground-muted); margin-top:0.4rem;">
<span style="color:#d62728;">━</span> mutually exclusive &nbsp;
<span style="color:#17a2b8;">━</span> co-occurring &nbsp;·&nbsp;
<span style="background:#ffe08a; border:1px solid #1a1a1a; border-radius:50%; padding:0 .45rem;">●</span> OncoKB driver gene &nbsp;·&nbsp;
node size ∝ marginal driver frequency, edge width ∝ |ρ|. Scroll to zoom, drag to pan.
</div>

## Ranked dependencies

```js
const tableRows = (() => {
  const b = rec.bmrs[bmr];
  if (!b) return [];
  const dirs = direction === "both" ? ["ME", "CO"] : [direction];
  const rows = [];
  for (const d of dirs) {
    for (const e of (b[d]?.edges ?? []).slice(0, topk)) {
      rows.push({
        Pair: `${e.ga} : ${e.gb}`, Type: d,
        ρ: e.rho, LRT: e.lrt, τ11: e.tau11,
        n11: e.n11, n10: e.n10, n01: e.n01, n00: e.n00
      });
    }
  }
  return rows;
})();
```

```js
Inputs.table(tableRows, {
  rows: 16,
  sort: direction === "CO" ? "LRT" : "ρ",
  reverse: direction === "CO",
  format: {ρ: (x) => x.toFixed(3), τ11: (x) => x.toFixed(3), LRT: (x) => x.toFixed(2)}
})
```

```js
display(html`<div style="font-size:0.85rem; color:var(--theme-foreground-muted);">
  Showing the top ${topk} ME and CO pairs (gene-effect level; <code>_M</code> = missense,
  <code>_N</code> = nonsense). ρ is the bivariate-Bernoulli correlation (negative = ME,
  positive = CO); LRT is the likelihood-ratio statistic; τ11 is the joint driver probability;
  n·· are the contingency counts. Pairs pass the ε-filter and intra-gene exclusion (Methods).
</div>`);
```
