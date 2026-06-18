export function Footer() {
  return (
    <footer className="mx-auto mt-20 max-w-[1640px] px-5 pb-16">
      <div className="hairline mb-6" />
      <div className="flex flex-col gap-3 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl leading-relaxed">
          Companion atlas to the DIALECT manuscript. Networks show driver mutual-exclusivity and
          co-occurrence dependencies after the per-gene/per-sample background-mutation-rate model,
          the ε-filter, and intra-gene exclusion.
        </p>
        <div className="flex shrink-0 items-center gap-4">
          <a
            className="focus-ring rounded transition-colors hover:text-foreground"
            href="https://github.com/raphael-group/dialect"
            target="_blank"
            rel="noreferrer"
          >
            raphael-group/dialect
          </a>
          <span className="eyebrow">v1 · 2026</span>
        </div>
      </div>
    </footer>
  );
}
