# DIALECT Atlas k100-2026-08-26

Complete K=100 release for 71 TCGA, MSK-IMPACT, and MSK-CHORD cohorts.

## Files

- `manifest.json`: immutable analysis contract, coverage, methods, and provenance.
- `index.json`: cohort metadata, summaries, paths, byte counts, and SHA-256 hashes.
- `cohorts/<study>__<cohort>.json`: every evaluated DIALECT pair for CBaSE,
  DIG, and MutSigCV2 plus every Fisher, DISCOVER, MEGSA, and WeSME/WeSCO result.

Compact tables store a `fields` array followed by positional `rows`. Gene-effect
suffixes are `_M` (missense) and `_N` (nonsense). Observed contingency fields are
named semantically: `observed_both`, `observed_b_only`, `observed_a_only`, and
`observed_neither`.

## DIALECT inference

For every cohort and BMR, `p = chi2.sf(max(LRT, 0), df=1)` and Benjamini-Hochberg
is applied once across all evaluated pairs. ME and CO share the same correction
family. `q < 0.01` is significant. Direction comes from rho (`rho < 0`: ME;
`rho > 0`: CO). No epsilon filter is applied. ME ranks by rho ascending; CO ranks
by raw LRT descending. Raw negative numerical LRT values are preserved but carry
zero evidence for the p-value.

Tau values are preserved exactly as fitted. When a pair has samples with no
background-PMF support, those samples contribute zero posterior mass in the
historical EM implementation. `tau_mass` then equals `effective_n / cohort_n`
rather than one; `effective_n` and `excluded_samples` expose that condition for
every pair. The release does not renormalize these values, and such fits can be
biased, particularly for hypermutated samples.

The default web view requires the exact gene-effect pair and direction to agree
across all three BMRs. FDR support is reported separately; strict consensus means
`q < 0.01` under all three.

Each BMR can cover a different set of gene-effects because a provider may not emit
a background PMF for every feature. K=100 therefore means the top 100 count-ranked
features available to that BMR. Consensus is evaluated only where the exact pair
was tested by all three BMRs. A missing comparison-method value means that pair was
outside that method's separately selected count-ranked K=100 universe, not that
the method found negative evidence.

Equal-count ties preserve each historical producer's ordering: count-matrix column
order for CBaSE and DIG, and pandas descending quicksort order for MutSigCV2. Every
cohort publishes the selected ordered feature list and its SHA-256 digest.

The historical MutSig producer is hybrid: it uses per-sample MutSig lambda values
when a feature's base gene is present on the MutSig gene axis and otherwise falls
back to that cohort's CBaSE PMF. The release publishes both feature-origin lists.
Pairs touching a fallback feature remain available in the individual MutSig view
but are excluded from the default all-three consensus because they do not provide
a distinct-background third-model sensitivity check.

## Baseline calls

Fisher, DISCOVER, WeSME, and WeSCO use their emitted direction-specific BH
`q < 0.01`. MEGSA is ME-only and uses `p < 0.001`. Baselines are recomputed from
the existing count matrices and do not require a DIALECT or BMR rerun.

See `manifest.json` for exact source hashes, software versions, RNG seeds, and
method provenance. The historical DIALECT tables were produced across more than
one development snapshot and the original run commit was not recorded. The release
therefore does not attribute them to the current repository HEAD: it records exact
result/input hashes and timestamps plus the implementation snapshot used for release
assembly. The comparison-method tables were regenerated deterministically for this
release.
