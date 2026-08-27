# DIALECT Atlas

The visual companion to DIALECT, a latent-variable method for evaluating mutual
exclusivity and co-occurrence between somatic gene-effect pairs in cancer.

[Explore the Atlas](https://ahmed-shuaibi.github.io/dialect-atlas/)

Choose a cancer type and cohort, then explore significant interactions as a
network or compact ranked list. The default view requires the same pair and
direction at `q < 0.01` under CBaSE, DIG, and a real MutSigCV2 background;
CBaSE fallback features are not counted as MutSigCV2 support. Individual BMR
views and Fisher, DISCOVER, MEGSA, WeSME, and WeSCO comparisons are available
without crowding the primary view.

The published `k100-2026-08-26` release contains every evaluated pair from up
to 100 count-ranked, provider-eligible features in each of 71 TCGA, MSK-IMPACT,
and MSK-CHORD cohorts. Every release file is immutable and SHA-256 verified
during deployment.

## Local development

```bash
npm ci
npm run check
npm run dev
```

The production build keeps the current GitHub Pages subpath and canonical URL
by default. Build for a custom domain at the site root with:

```bash
ATLAS_BASE_PATH=/ ATLAS_SITE_URL=https://example.org npm run build
```

The release schema, provenance, thresholds, and field definitions are documented
inside `public/data/releases/k100-2026-08-26/README.md`.

## Cite

```bibtex
@article{shuaibi2024dialect,
  author  = {Ahmed Shuaibi and Uthsav Chitra and Benjamin J. Raphael},
  title   = {A latent variable model for evaluating mutual exclusivity and
             co-occurrence between driver mutations in cancer},
  journal = {bioRxiv},
  year    = {2024},
  doi     = {10.1101/2024.04.24.590995}
}
```

BSD-3-Clause. See [LICENSE](LICENSE).
