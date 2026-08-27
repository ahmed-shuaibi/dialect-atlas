import { Download, ExternalLink, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cohortUrl, indexUrl, manifestUrl, readmeUrl } from "@/features/atlas/lib/atlas-data";
import type { CohortMeta, ReleaseBundle } from "@/features/atlas/types";

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberFact(value: unknown): string {
  return typeof value === "number" ? value.toLocaleString("en-US") : "—";
}

function DownloadLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      download
      className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-semibold transition-colors hover:border-ink/25 hover:bg-sand"
    >
      <Download className="size-3.5" aria-hidden />
      {children}
    </a>
  );
}

function MatrixVisual() {
  const active = new Set([1, 6, 8, 13, 17, 22]);
  return (
    <div className="grid w-36 grid-cols-6 gap-1" aria-hidden>
      {Array.from({ length: 24 }, (_, index) => (
        <span
          key={index}
          className={
            active.has(index)
              ? "aspect-square rounded-[3px] bg-brand"
              : "aspect-square rounded-[3px] border border-line bg-canvas"
          }
        />
      ))}
    </div>
  );
}

function EquationVisual() {
  return (
    <div className="flex items-baseline gap-2 font-mono text-2xl font-medium tracking-[-0.04em]" aria-hidden>
      <span className="text-ink">C</span>
      <span className="text-muted">=</span>
      <span className="text-brand">B</span>
      <span className="text-muted">+</span>
      <span className="text-support">D</span>
    </div>
  );
}

function PairVisual() {
  return (
    <div className="grid w-40 gap-3" aria-hidden>
      <div className="flex items-center gap-2">
        <span className="size-5 rounded-full border-[5px] border-me-soft bg-me" />
        <span className="h-1 flex-1 rounded-sm bg-me/55" />
        <span className="size-5 rounded-full border-[5px] border-me-soft bg-me" />
        <span className="ml-1 font-mono text-[10px] font-medium text-me">ME</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="size-5 rounded-full border-[5px] border-co-soft bg-co" />
        <span className="h-px flex-1 border-t border-dashed border-co/50" />
        <span className="size-5 rounded-full border-[5px] border-co-soft bg-co" />
        <span className="ml-1 font-mono text-[10px] font-medium text-co">CO</span>
      </div>
    </div>
  );
}

function ThresholdVisual() {
  return (
    <div className="font-mono" aria-hidden>
      <p className="text-xs font-semibold text-muted">significant</p>
      <p className="mt-1 text-2xl font-medium tracking-[-0.05em] text-support">q &lt; 0.01</p>
    </div>
  );
}

const STEPS = [
  {
    number: "01",
    title: "Count mutation events",
    body: "Rows are tumor samples. Columns are gene effects. Each cell records a somatic mutation count.",
    visual: <MatrixVisual />,
  },
  {
    number: "02",
    title: "Separate driver from background",
    body: "DIALECT models each observed count C as passenger background B plus latent driver signal D.",
    visual: <EquationVisual />,
  },
  {
    number: "03",
    title: "Fit each gene pair",
    body: "Negative ρ indicates mutual exclusivity; positive ρ indicates co-occurrence. The LRT tests departure from independence.",
    visual: <PairVisual />,
  },
  {
    number: "04",
    title: "Control false discovery",
    body: "Within each cohort and background model, one Benjamini–Hochberg family covers all evaluated ME and CO pairs. q < 0.01 is significant.",
    visual: <ThresholdVisual />,
  },
] as const;

const GLOSSARY = [
  {
    term: "_M / _N",
    definition: "Missense and nonsense gene-effect columns.",
  },
  {
    term: "ρ (rho)",
    definition: "Interaction direction: negative for ME, positive for CO.",
  },
  {
    term: "LRT",
    definition: "Likelihood-ratio test statistic used to quantify departure from no interaction.",
  },
  {
    term: "q / FDR",
    definition: "Multiple-testing-adjusted p-value. This release calls q < 0.01 significant.",
  },
  {
    term: "K = 100",
    definition: "Top 100 count-ranked gene effects available to each background model.",
  },
  {
    term: "BMR",
    definition: "Background mutation-rate model used to estimate passenger counts.",
  },
] as const;

export function AboutView({ bundle, cohort }: { bundle: ReleaseBundle; cohort: CohortMeta | null }) {
  const coverage = objectRecord(bundle.manifest.coverage);
  const analysis = objectRecord(bundle.manifest.analysis);
  const releaseFacts = [
    ["Cohorts", numberFact(coverage.cohorts)],
    ["Tumor samples", numberFact(coverage.samples)],
    ["Gene-effect cap", numberFact(analysis.top_k_event_features)],
    [
      "Significance",
      typeof analysis.fdr_threshold === "number" ? `q < ${analysis.fdr_threshold}` : "q < 0.01",
    ],
  ];

  return (
    <TooltipProvider delayDuration={250}>
      <section className="mx-auto max-w-7xl pb-20 pt-12 sm:pt-16">
        <header className="grid items-end gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <div>
            <h1 className="max-w-[14ch] text-[clamp(3rem,6.2vw,5.4rem)] font-[650] leading-[0.96] tracking-[-0.045em]">
              Find meaningful gene interactions.
            </h1>
          </div>
          <p className="max-w-xl text-lg font-medium leading-8 text-muted">
            DIALECT separates likely passenger mutations from latent driver signal, then identifies gene pairs that occur together less or more often than expected.
          </p>
        </header>

        <section aria-labelledby="method-heading" className="mt-12">
          <h2 id="method-heading" className="sr-only">How DIALECT works</h2>
          <div className="grid overflow-hidden rounded-[24px] border border-line bg-line shadow-soft md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step) => (
              <article key={step.number} className="flex min-h-72 flex-col bg-paper p-5 sm:p-6">
                <p className="font-mono text-xs font-medium text-muted">{step.number}</p>
                <div className="mt-7 flex min-h-16 items-center">{step.visual}</div>
                <h3 className="mt-7 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="surface-card p-6 sm:p-7">
            <h2 className="text-2xl font-semibold">Three views of the same cohort</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
              CBaSE is primary. DIG and MutSigCV2 test sensitivity to the background model. The default ranks exact pairs with the same direction under all three.
            </p>
            <p className="mt-4 border-l-2 border-brand pl-4 text-base font-medium leading-7 text-ink">
              This is sensitivity agreement, not independent replication. Significant-only applies the selected q cutoff to each background; MutSig rows reusing CBaSE are excluded from consensus.
            </p>
          </article>
          <article className="rounded-[24px] border border-co/20 bg-co-soft/60 p-6 sm:p-7">
            <p className="font-mono text-xs font-medium text-co">CO caution</p>
            <h2 className="mt-3 text-2xl font-semibold">Tumor burden can mimic co-occurrence.</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              Treat CO findings as candidates and compare backgrounds. Per-sample mutation burden can create apparent co-occurrence, especially in hypermutated tumors.
            </p>
          </article>
        </section>

        <section aria-labelledby="terms-heading" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="terms-heading" className="text-3xl font-semibold">Read the notation</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="focus-ring rounded-full text-sm font-semibold text-muted underline decoration-line underline-offset-4 hover:text-ink">
                  Why backgrounds matter
                </button>
              </TooltipTrigger>
              <TooltipContent>
                The background model is load-bearing: it changes how much of each observed mutation count is attributed to passengers.
              </TooltipContent>
            </Tooltip>
          </div>
          <dl className="mt-5 grid gap-px overflow-hidden rounded-[24px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {GLOSSARY.map((item) => (
              <div key={item.term} className="bg-paper p-5">
                <dt className="font-mono text-sm font-medium text-ink">{item.term}</dt>
                <dd className="mt-2 text-sm leading-6 text-muted">{item.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="release-heading" className="surface-card mt-12 p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-support">
                <LockKeyhole className="size-3.5" aria-hidden />
                {bundle.manifest.immutable ? "Immutable release" : "Release"}
              </div>
              <h2 id="release-heading" className="mt-2 text-2xl font-semibold">
                {bundle.manifest.release_id}
              </h2>
            </div>
            <a
              href="https://github.com/raphael-group/dialect"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-muted underline decoration-line underline-offset-4 hover:text-ink"
            >
              Source code <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>

          <dl className="mt-6 grid gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {releaseFacts.map(([label, value]) => (
              <div key={label} className="bg-canvas/65 px-4 py-3">
                <dt className="text-xs font-semibold text-muted">{label}</dt>
                <dd className="mt-1 font-mono text-[15px] font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <DownloadLink href={manifestUrl()}>Manifest</DownloadLink>
            <DownloadLink href={indexUrl(bundle)}>Cohort index</DownloadLink>
            <DownloadLink href={readmeUrl(bundle)}>Data dictionary</DownloadLink>
            {cohort && <DownloadLink href={cohortUrl(cohort)}>Current cohort</DownloadLink>}
          </div>
        </section>
      </section>
    </TooltipProvider>
  );
}
