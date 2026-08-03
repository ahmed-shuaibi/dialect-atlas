/**
 * Editorial on-ramp (REDESIGN2 §1/§3): mono eyebrow → one serif descriptor line. Nothing else —
 * the network is the argument, so the methodology dek and the ME/CO/ρ/LRT/τ glossary are gone.
 * ME/CO meaning lives in the always-visible network legend (shown, not lectured); the ρ/LRT/τ and
 * _M/_N definitions live on the ResultTable column-header InfoTips, at point-of-need.
 *
 * This is the only serif voice that owns the heading zone — the nav wordmark reads mono/sans so the
 * h1 stays the clear anchor. Capped at a ~65ch reading measure (REDESIGN2 §4).
 */
export function EditorialHeader() {
  return (
    <header className="max-w-[65ch]">
      <p className="eyebrow">dialect atlas</p>
      <h1 className="mt-label font-serif text-h1 tracking-tight text-foreground">
        Mutually exclusive &amp; co-occurring drivers
      </h1>
    </header>
  );
}
