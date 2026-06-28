import type { ReactNode } from "react";
import { EdgeSwatch } from "@/components/ui/badge";

/**
 * Editorial on-ramp (REDESIGN C3 / R3): mono eyebrow → serif h1 → 2-3 sentence Inter dek in a
 * ~680px reading measure → a compact inline legend + glossary that defines, in one glance each,
 * the edge encodings (ME / CO + _M / _N) and the table stats (ρ / LRT / τ₁₁). This is the only
 * serif voice that owns the heading zone — the nav wordmark reads mono/sans so the h1 stays the
 * clear anchor (SiteNav is out of scope here; not edited).
 *
 * No props — static editorial content. No interactive chrome: the full ρ/LRT/τ tooltips live on
 * the ResultTable column headers where they're contextual; here the plain-language def is enough.
 */
export function EditorialHeader() {
  return (
    <header className="max-w-[680px]">
      <p className="eyebrow">dialect atlas</p>
      <h1 className="mt-label font-serif text-h1 tracking-tight text-foreground">
        Mutual exclusivity &amp; co-occurrence of cancer driver mutations
      </h1>
      <p className="mt-caption text-body text-muted-foreground-strong">
        DIALECT infers statistical dependencies between cancer driver genes after correcting for each
        tumor&apos;s background mutation rate, so the patterns it surfaces reflect selection rather than
        mutational load. <strong className="text-foreground">Blue, solid</strong> links mark{" "}
        <strong className="text-foreground">mutually exclusive</strong> drivers;{" "}
        <strong className="text-foreground">amber, dashed</strong> links mark{" "}
        <strong className="text-foreground">co-occurring</strong> drivers. Dependencies are ranked
        within each of <span className="font-mono tnum text-foreground">69</span> cohorts and scored
        for robustness across <span className="font-mono tnum text-foreground">3</span>{" "}
        background-rate models.
      </p>

      {/* Compact legend + glossary — two clusters: how edges look (ME/CO + _M/_N) and what the
          numbers mean (ρ/LRT/τ₁₁), parsed at a glance via a faint vertical rule between them. */}
      <dl className="mt-caption flex flex-wrap items-center gap-x-control-row gap-y-label text-meta text-muted-foreground-strong">
        <GlossTerm
          term={
            <span className="flex items-center gap-label">
              <EdgeSwatch type="ME" />
              <span className="font-medium text-foreground">ME</span>
            </span>
          }
          def="mutually exclusive"
        />
        <GlossTerm
          term={
            <span className="flex items-center gap-label">
              <EdgeSwatch type="CO" />
              <span className="font-medium text-foreground">CO</span>
            </span>
          }
          def="co-occurring"
        />
        <GlossTerm
          term={<span className="font-mono text-foreground">_M / _N</span>}
          def="missense / nonsense"
        />

        <span aria-hidden className="hidden h-4 w-px bg-border sm:block" />

        <GlossTerm term={<span className="font-mono text-foreground">ρ</span>} def="dependency strength" />
        <GlossTerm term={<span className="font-mono text-foreground">LRT</span>} def="evidence" />
        <GlossTerm term={<span className="font-mono text-foreground">τ₁₁</span>} def="joint driver rate" />
      </dl>
    </header>
  );
}

/** One glossary entry: term (dt) + plain-language def (dd). Quiet, non-interactive. */
function GlossTerm({ term, def }: { term: ReactNode; def: ReactNode }) {
  return (
    <div className="flex items-center gap-label">
      <dt>{term}</dt>
      <dd>{def}</dd>
    </div>
  );
}
