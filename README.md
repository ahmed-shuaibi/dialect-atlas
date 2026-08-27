# DIALECT Atlas

The visual companion to DIALECT, a latent-variable method for evaluating mutual
exclusivity and co-occurrence between somatic gene-effect pairs in cancer.

[Explore the Atlas](https://dialectcanceratlas.com/)

Choose a cancer type and cohort, then explore ranked mutually exclusive and
co-occurring interactions in one list or an interactive network. The default
candidate view requires the same pair and direction under CBaSE, DIG, and a real
MutSigCV2 background; CBaSE fallback features are not counted as MutSigCV2
support. `Significant only` applies the selected q-value cutoff across all three.
Individual BMR views and Fisher, DISCOVER, MEGSA, WeSME, and WeSCO comparisons
remain available in the same concise interface.

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

The production build targets `https://dialectcanceratlas.com` at the site root.
Cloudflare Pages and the CI workflow set the same values explicitly. The build
validates rendered metadata, asset paths, security headers, and release files:

```bash
ATLAS_BASE_PATH=/ ATLAS_SITE_URL=https://dialectcanceratlas.com npm run build
```

Cloudflare Pages project `dialect-cancer-atlas` deploys `main`; GitHub Actions is
CI-only and GitHub Pages is retired. See
[`docs/custom-domain.md`](docs/custom-domain.md) for the build, routing, security,
redirect, and rollback contract.

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
