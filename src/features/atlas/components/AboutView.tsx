import { Download, ExternalLink, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cohortUrl, indexUrl, manifestUrl, readmeUrl } from "@/features/atlas/lib/atlas-data";
import type { CohortMeta, ReleaseBundle } from "@/features/atlas/types";

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function releaseFacts(bundle: ReleaseBundle): [string, string][] {
  const coverage = objectRecord(bundle.manifest.coverage);
  const analysis = objectRecord(bundle.manifest.analysis);
  const format = (value: unknown) =>
    typeof value === "number" ? value.toLocaleString("en-US") : "—";

  return [
    ["cancer cohorts", format(coverage.cohorts)],
    ["tumor samples", format(coverage.samples)],
    ["DIALECT tables", format(coverage.dialect_tables)],
    ["comparison tables", format(coverage.baseline_tables)],
    ["feature cap per model", format(analysis.top_k_event_features)],
    [
      "FDR threshold",
      typeof analysis.fdr_threshold === "number"
        ? `< ${analysis.fdr_threshold}`
        : "—",
    ],
  ];
}

function DownloadLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      download
      className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-xs font-bold transition-colors hover:border-ink/30 hover:bg-white"
    >
      <Download className="size-3.5" aria-hidden />
      {children}
    </a>
  );
}

export function AboutView({ bundle, cohort }: { bundle: ReleaseBundle; cohort: CohortMeta | null }) {
  const facts = releaseFacts(bundle);
  return (
    <section className="mx-auto max-w-5xl pb-24 pt-16 sm:pt-24">
      <p className="eyebrow">About the atlas</p>
      <h1 className="mt-5 max-w-[13ch] text-balance text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] tracking-[-0.065em]">
        Statistical interactions, without the clutter.
      </h1>
      <p className="mt-8 max-w-2xl text-balance text-xl font-semibold leading-8 text-muted">
        DIALECT separates passenger background from latent driver mutations, then tests gene-effect pairs for mutual exclusivity and co-occurrence.
      </p>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        <article className="rounded-[2rem] border border-line bg-paper p-6 shadow-soft">
          <p className="eyebrow">Read the result</p>
          <h2 className="mt-4 text-2xl font-black tracking-tight">Less or more than expected.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            ME and CO compare inferred joint driver states with the fitted no-interaction model. Pair detail also flags samples with no background support.
          </p>
        </article>
        <article className="rounded-[2rem] border border-line bg-paper p-6 shadow-soft">
          <p className="eyebrow">Default view</p>
          <h2 className="mt-4 text-2xl font-black tracking-tight">Exact three-model consensus.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            CBaSE is primary. DIG and MutSigCV2 are robustness analyses. Default consensus is directional sensitivity agreement, not a significance call. Strict FDR support requires q &lt; 0.01 in all three.
          </p>
        </article>
        <article className="rounded-[2rem] border border-line bg-paper p-6 shadow-soft">
          <p className="eyebrow">CO caution</p>
          <h2 className="mt-4 text-2xl font-black tracking-tight">Tumor burden can look like co-occurrence.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Many CO calls are sensitive to per-sample mutation burden. Treat them as candidates, compare BMRs, and use MutSigCV2 where per-sample lambda is available.
          </p>
        </article>
      </div>

      <section aria-labelledby="release-heading" className="mt-14 rounded-[2rem] border border-line bg-paper p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-support/25 bg-support-soft text-support">
                <LockKeyhole className="size-3" aria-hidden />
                {bundle.manifest.immutable ? "immutable" : "mutable"}
              </Badge>
              <Badge>schema {bundle.manifest.schema_version}</Badge>
            </div>
            <h2 id="release-heading" className="mt-4 break-all text-2xl font-black tracking-tight">
              {bundle.manifest.release_id}
            </h2>
            <p className="mt-2 text-sm text-muted">Generated {bundle.manifest.generated_at}</p>
          </div>
          <a
            href="https://github.com/raphael-group/dialect"
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-bold underline decoration-line underline-offset-4 hover:decoration-ink"
          >
            Source code <ExternalLink className="size-4" aria-hidden />
          </a>
        </div>

        <dl className="mt-8 grid gap-x-8 gap-y-4 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="eyebrow">{label}</dt>
              <dd className="mt-1 font-mono text-sm font-semibold">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6">
          <DownloadLink href={manifestUrl()}>Manifest JSON</DownloadLink>
          <DownloadLink href={indexUrl(bundle)}>Cohort index JSON</DownloadLink>
          <DownloadLink href={readmeUrl(bundle)}>Release data dictionary</DownloadLink>
          {cohort && <DownloadLink href={cohortUrl(cohort)}>{cohort.cancer} JSON</DownloadLink>}
        </div>
        {cohort && (
          <p className="mt-4 break-all font-mono text-[10px] leading-5 text-muted">
            SHA-256 {cohort.data_sha256} · {cohort.data_bytes.toLocaleString("en-US")} bytes
          </p>
        )}
      </section>
    </section>
  );
}
