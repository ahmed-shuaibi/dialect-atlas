# DIALECT Atlas

The interactive companion to DIALECT, a latent-variable method for evaluating
mutual exclusivity and co-occurrence between somatic gene-effect pairs in cancer.

[Explore the Atlas](https://ahmed-shuaibi.github.io/dialect-atlas/)

The published `k100-2026-08-26` release contains every evaluated pair from up
to 100 count-ranked, provider-eligible features in each of 71 TCGA, MSK-IMPACT,
and MSK-CHORD cohorts under CBaSE, DIG, and MutSigCV2 background-mutation-rate
models. It also includes Fisher, DISCOVER, MEGSA, WeSME, and WeSCO comparison
results. Every data file is immutable and SHA-256 verified during deployment.

## Local development

```bash
npm ci
npm run check
npm run dev
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
