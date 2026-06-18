# DIALECT Atlas

Interactive companion site for [DIALECT](https://github.com/raphael-group/dialect) — an atlas of
driver **mutual-exclusivity (ME)** and **co-occurrence (CO)** interaction networks across **69
cancer cohorts** (TCGA, MSK-IMPACT, MSK-CHORD) and **three background-mutation-rate (BMR) models**
(CBaSE, Dig, sample-specific MutSigCV2).

Built with [Observable Framework](https://observablehq.com/framework); networks rendered with
[Cytoscape.js](https://js.cytoscape.org/). Fully static — deploys to GitHub Pages.

> **Pre-publication:** the companion manuscript is under review, so the site is served with
> `noindex`. Remove the robots meta in `observablehq.config.js` at publication.

## Develop

```sh
npm install
npm run dev      # preview at http://localhost:3000
npm run build    # static build into dist/
```

## Data

`src/data/atlas.json` is generated from the DIALECT result CSVs by
[`analysis/build_atlas_data.py`](https://github.com/raphael-group/dialect/blob/main/analysis/build_atlas_data.py)
in the main repo:

```sh
# from the dialect repo
python -m analysis.build_atlas_data --out ../dialect-atlas/src/data --k 50
```

Each cohort record holds, for every BMR model, the top-K ME (ρ<0) and CO (ρ>0) gene-effect pairs
after the ε-filter and intra-gene exclusion, with ρ, the likelihood-ratio statistic, the joint
driver probability τ₁₁, and the 2×2 contingency counts.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it
to GitHub Pages.
