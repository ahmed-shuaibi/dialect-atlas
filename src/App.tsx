import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Check, ExternalLink, HelpCircle, Link2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import { Button, buttonVariants } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/heading";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useHashState } from "@/lib/useHashState";
import { css } from "@/lib/motion";
import { fmtInt } from "@/lib/utils";
import { AtlasCommand } from "@/features/atlas/components/AtlasCommand";
import { ActiveChips } from "@/features/atlas/components/ActiveChips";
import { BMR_LABEL, BMR_SUB, bmrCounts } from "@/features/atlas/lib/atlas-transform";
import {
  EditorialHeader,
  NetworkView,
  ResultTable,
  VIEW_DEFAULTS,
  resolveCohort,
  useAtlas,
  useAtlasView,
  useCohort,
  type Bmr,
  type DirFilter,
  type NetSelection,
} from "@/features/atlas";
import type { Atlas, Cohort } from "@/features/atlas/types";

/** Reading-measure shell: the site's section width, calm gutter (REDESIGN2 §4). */
const SHELL = "mx-auto w-full max-w-4xl px-6";

/**
 * True when the global ←/→ cohort stepper should stand down for this event's target: an editable
 * field (don't hijack typing/search) OR a widget that owns its own arrow-key semantics — a
 * `role="radiogroup"` Segmented (Model / Show) or a listbox (the ⌘K command list). The Segmented
 * primitive already `stopPropagation`s, but its Popover portals to <body>, so this also guards the
 * document-level listener directly (belt and suspenders — no double-handling either way).
 */
function ownsArrowKeys(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) return true;
  return el.closest?.('[role="radiogroup"],[role="listbox"],[role="dialog"]') != null;
}

export function App() {
  const { atlas, error } = useAtlas();
  const [hash, setHash] = useHashState({ ...VIEW_DEFAULTS });
  const [selected, setSelected] = useState<NetSelection | null>(null);

  const onSelect = useCallback((s: NetSelection | null) => setSelected(s), []);
  useEffect(() => setSelected(null), [hash.c, hash.b, hash.d, hash.f]);

  // Keyboard niceties (REDESIGN2 §6.9): ←/→ step through cohorts so the atlas is browsable
  // without opening ⌘K; Esc clears a selected pair (Radix already closes the anchored popover,
  // this also covers a selection made from the canvas). ⌘K / "/" to open live in AtlasCommand.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key === "Escape") {
        setSelected((s) => (s ? null : s));
        return;
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (ownsArrowKeys(e.target) || !atlas) return;
      const list = atlas.cohorts;
      const cur = resolveCohort(hash, atlas);
      const i = list.findIndex((c) => c.id === cur.id);
      if (i < 0) return;
      const next =
        e.key === "ArrowLeft" ? Math.max(0, i - 1) : Math.min(list.length - 1, i + 1);
      if (next !== i) {
        e.preventDefault();
        setHash({ c: list[next].id });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [atlas, hash, setHash]);

  // Resolve the selected cohort from the index, then lazily hydrate its heavy shard (edges).
  const cohortMeta = atlas ? resolveCohort(hash, atlas) : null;
  const { cohort: hydrated, error: cohortError } = useCohort(cohortMeta);
  const view = useAtlasView(hash, atlas, hydrated);

  if (error || cohortError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-meta text-muted-foreground-strong">
        Failed to load atlas data.
      </div>
    );
  }

  if (!atlas || !view) {
    return (
      <>
        <SiteNav />
        <main className={`${SHELL} space-y-section pt-page-top`}>
          <div className="max-w-[65ch] space-y-caption">
            <div className="h-9 w-72 animate-pulse rounded-md bg-white/[0.04]" />
            <div className="h-8 w-96 animate-pulse rounded-md bg-white/[0.03]" />
          </div>
          <div className="flex flex-col gap-control-row sm:flex-row">
            <div className="h-14 w-full animate-pulse rounded-md bg-white/[0.03] sm:w-[var(--control-width)]" />
            <div className="h-14 w-full animate-pulse rounded-md bg-white/[0.03] sm:w-[var(--control-width)]" />
          </div>
          {/* dependency network — the hero visual, shares the network height token (no CLS) */}
          <div className="h-network w-full animate-pulse rounded-lg bg-white/[0.03]" />
          {/* ranked table */}
          <div className="h-80 w-full animate-pulse rounded-lg bg-white/[0.03]" />
        </main>
      </>
    );
  }

  const { cohort, bmr, dir, net, rows } = view;
  const nModels = atlas.bmrs.filter((b) => cohort.bmrs[b]).length;

  return (
    <TooltipProvider delayDuration={150}>
      <SiteNav />
      <main className={`${SHELL} space-y-section pb-page-top pt-page-top`}>
        {/* Thin header bar: eyebrow + serif descriptor (left) · the ONE ⌘K command (right).
            EditorialHeader owns the semantic <header>; the command trigger sits beside it. */}
        <div className="space-y-caption">
          <div className="flex flex-wrap items-start justify-between gap-control-row">
            <EditorialHeader />
            <div className="flex items-center gap-label">
              <AtlasCommand
                atlas={atlas}
                cohort={cohort}
                bmr={bmr}
                dir={dir}
                onCohortChange={(c) => setHash({ c })}
                onBmrChange={(b) => setHash({ b })}
                onDirChange={(d) => setHash({ d })}
              />
              <HowToRead atlas={atlas} />
            </div>
          </div>
          <ActiveChips
            bmr={bmr}
            dir={dir}
            onResetBmr={() => setHash({ b: VIEW_DEFAULTS.b })}
            onResetDir={() => setHash({ d: VIEW_DEFAULTS.d })}
          />
        </div>

        {/* 01 — the network hero, leading the page */}
        <section aria-label="Network" className="space-y-caption">
          <SectionHeader index={1} label="network" />
          <NetworkCaption cohort={cohort} bmr={bmr} />
          {net.empty ? (
            <EmptyState
              atlas={atlas}
              cohort={cohort}
              bmr={bmr}
              dir={dir}
              onBmrChange={(b) => setHash({ b })}
            />
          ) : (
            <NetworkView
              elements={net.elements}
              minW={net.minW}
              maxW={net.maxW}
              selected={selected}
              onSelect={onSelect}
            />
          )}
        </section>

        {/* 02 — ranked pairs, the analytical backbone below the visual */}
        <section aria-label="Ranked pairs" className="space-y-caption">
          <SectionHeader
            index={2}
            label="ranked pairs"
            kicker={`${fmtInt(rows.length)} ${rows.length === 1 ? "pair" : "pairs"}`}
          />
          <ResultTable
            key={dir}
            rows={rows}
            selected={selected}
            onSelect={onSelect}
            nModels={nModels}
            cohort={cohort}
            atlas={atlas}
            bmr={bmr}
            defaultSort={dir === "ME" ? { key: "rho", dir: "asc" } : { key: "lrt", dir: "desc" }}
          />
        </section>
      </main>
      <Footer />
    </TooltipProvider>
  );
}

/**
 * One mono caption line that IS the result statement (REDESIGN2 §3): cohort · n · median per-sample
 * somatic mutation burden · model, trailed by two icon-only affordances — cBioPortal (TCGA-only;
 * absence is the message, so it renders null otherwise) and a copy-link for the shareable hash URL.
 *
 * NOTE: `median_tmb` is DIALECT's `cm.sum(axis=1).median()` — the median per-sample mutation COUNT
 * across the analysed genes, NOT mutations per megabase. Labelled "median mut" so we don't overclaim.
 */
function NetworkCaption({ cohort, bmr }: { cohort: Cohort; bmr: Bmr }) {
  const hasCbio = cohort.study === "TCGA" && !!cohort.cbio;
  return (
    <div className="flex flex-wrap items-center gap-x-caption gap-y-label">
      <p className="max-w-[65ch] font-mono text-meta tnum text-muted-foreground-strong">
        {cohort.cohort} · n={fmtInt(cohort.n_samples)} · {cohort.median_tmb} median mut ·{" "}
        {BMR_LABEL[bmr]}
      </p>
      <div className="flex items-center gap-intra sm:ml-auto">
        {hasCbio ? (
          <a
            href={cohort.cbio}
            target="_blank"
            rel="noreferrer"
            aria-label="Open this cohort's cBioPortal study"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
        <CopyLinkButton />
      </div>
    </div>
  );
}

/** Icon-only copy of the current shareable hash URL, with a brief check confirmation. */
function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={copy}
      aria-label="Copy a shareable link to this view"
    >
      {copied ? (
        <Check className="size-3.5 text-brand" aria-hidden />
      ) : (
        <Link2 className="size-3.5" aria-hidden />
      )}
    </Button>
  );
}

/**
 * HowToRead — the single quiet escape hatch (REDESIGN2 §3). One ghost help glyph beside the ⌘K
 * command opens a Popover holding ALL residual methodology, so nothing pedagogical clutters the
 * working surface: the visual encoding + size channels, the _M/_N effect suffix, the three
 * background-rate models, the robustness dot, and the ranking / eps / passenger filters. The
 * per-stat ρ/LRT/τ definitions stay on the table headers (point-of-need), not repeated here.
 */
function HowToRead({ atlas }: { atlas: Atlas }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label="How to read this atlas"
        >
          <HelpCircle className="size-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(30rem,90vw)]"
        style={{ animationDuration: css.durMs.base, animationTimingFunction: css.easeOut }}
      >
        <div className="max-h-[70vh] space-y-caption overflow-auto p-4">
          <p className="font-serif text-h2 tracking-tight text-foreground">How to read this</p>

          <HelpBlock label="the network">
            Each node is a driver gene; each edge is a dependency between two genes&apos; driver
            mutations. <span className="text-me">Solid blue</span> = mutually exclusive (rarely
            co-mutated); <span className="text-co">dashed amber</span> = co-occurring (mutated
            together more than chance). Node size = P(gene is mutated); edge width = |ρ| (dependency
            strength); a teal node is an OncoKB-annotated driver.
          </HelpBlock>

          <HelpBlock label="gene labels">
            Symbols carry a <span className="font-mono text-foreground">_M</span> (missense) or{" "}
            <span className="font-mono text-foreground">_N</span> (nonsense / truncating) suffix —
            DIALECT scores each mutation-effect class of a gene separately.
          </HelpBlock>

          <HelpBlock label="background-rate models">
            Three nulls for a tumor&apos;s expected mutation burden. A pair recovered under all of
            them is independent of that modeling choice.
            <span className="mt-label flex flex-col gap-intra">
              {atlas.bmrs.map((b) => (
                <span key={b} className="font-mono text-eyebrow text-muted-foreground-strong">
                  <span className="text-foreground">{BMR_LABEL[b]}</span> · {BMR_SUB[b]}
                </span>
              ))}
            </span>
          </HelpBlock>

          <HelpBlock label="robustness dot">
            The dot beside the model count is <span className="text-brand">solid</span> when every
            model agrees on the pair, and hollow when they split.
          </HelpBlock>

          <HelpBlock label="ranking & filters">
            Pairs are ranked by |ρ| after an eps effect-size filter; same-gene (intra-gene) pairs
            are excluded. Likely-passenger loci — long / hypermutation-prone genes such as TTN and
            MUC16 — are excluded by default so the top pairs aren&apos;t length artifacts.
          </HelpBlock>

          <a
            href="https://github.com/raphael-group/dialect"
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 rounded-sm font-mono text-eyebrow text-muted-foreground-strong transition-colors hover:text-foreground"
          >
            DIALECT manuscript &amp; method
            <ExternalLink className="size-3" aria-hidden />
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** One labeled methodology block inside HowToRead: eyebrow label + AA-safe body copy. */
function HelpBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-label">
      <p className="eyebrow">{label}</p>
      <p className="text-meta leading-relaxed text-muted-foreground-strong">{children}</p>
    </div>
  );
}

/**
 * Terse empty-state (REDESIGN2 §3): one dim line, plus inline text links to the background-rate
 * models that DO have pairs here, so recovery is one click. No bordered card, no count chips.
 */
function EmptyState({
  atlas,
  cohort,
  bmr,
  dir,
  onBmrChange,
}: {
  atlas: Atlas;
  cohort: Cohort;
  bmr: Bmr;
  dir: DirFilter;
  onBmrChange: (b: Bmr) => void;
}) {
  const dirLabel = dir === "both" ? "pairs" : `${dir} pairs`;
  const alternatives = atlas.bmrs.filter((b) => {
    if (b === bmr) return false;
    const c = bmrCounts(cohort, b);
    return (dir === "both" ? c.ME + c.CO : c[dir]) > 0;
  });

  return (
    <p className="max-w-[65ch] text-meta text-muted-foreground-strong">
      No {dirLabel} for {cohort.cohort} under {BMR_LABEL[bmr]}.
      {alternatives.length > 0 ? (
        <>
          {" "}
          Try{" "}
          {alternatives.map((b, i) => (
            <span key={b}>
              {i > 0 ? " / " : ""}
              <button
                type="button"
                onClick={() => onBmrChange(b)}
                className="focus-ring rounded-sm font-mono text-foreground underline decoration-border underline-offset-2 transition-colors hover:decoration-foreground"
              >
                {BMR_LABEL[b]}
              </button>
            </span>
          ))}
          .
        </>
      ) : null}
    </p>
  );
}
