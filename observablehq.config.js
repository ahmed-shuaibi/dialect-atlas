// DIALECT Atlas — Observable Framework config.
// Deployed as a GitHub Pages PROJECT site at <user>.github.io/dialect-atlas,
// so the base path must match the repo name.
export default {
  title: "DIALECT Atlas",
  root: "src",
  base: "/dialect-atlas/",
  theme: ["light", "wide"],
  toc: false,
  pager: false,
  footer:
    'DIALECT — driver-interaction (mutual-exclusivity / co-occurrence) networks across cancer cohorts. ' +
    'Companion to the DIALECT manuscript. Code: ' +
    '<a href="https://github.com/raphael-group/dialect">raphael-group/dialect</a>.',
  // noindex by default: the companion paper is under review. Remove the robots meta
  // at publication to allow search-engine indexing.
  head: '<meta name="robots" content="noindex">\n<meta name="description" content="Interactive atlas of DIALECT driver mutual-exclusivity and co-occurrence networks across 69 cancer cohorts and 3 background-mutation-rate models.">',
};
