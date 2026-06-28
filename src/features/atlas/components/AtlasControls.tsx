import { useState } from "react";
import { ArrowRight, Check, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, fmtInt } from "@/lib/utils";
import { CohortCombobox } from "@/features/atlas/components/CohortCombobox";
import { Field } from "@/features/atlas/components/Field";
import { InfoTip } from "@/features/atlas/components/InfoTip";
import {
  BMR_LABEL,
  BMR_SUB,
  STUDY_LABEL,
  bmrCounts,
} from "@/features/atlas/lib/atlas-transform";
import type { Atlas, Bmr, Cohort, DirFilter } from "@/features/atlas/types";

const SHOW_LABEL: Record<DirFilter, string> = {
  both: "Both",
  ME: "Mutually exclusive",
  CO: "Co-occurring",
};

const SHOW_ORDER: DirFilter[] = ["ME", "CO", "both"];

const showCountOf = (counts: { ME: number; CO: number }, d: DirFilter) =>
  d === "both" ? counts.ME + counts.CO : counts[d];

/**
 * Controls row + meta strip. Cohort combobox · BMR model · Show (default ME, each option
 * carries a live count) · passenger-exclusion toggle. Below: a labeled N / TMB / cBioPortal
 * meta strip (with InfoTips + copy-link), and an actionable empty-state when the selected
 * model has no pairs for the chosen direction (clickable chips recover to a model that does).
 * Pure presentational: receives view state + change handlers.
 */
export function AtlasControls({
  atlas,
  cohort,
  bmr,
  dir,
  excludePassengers,
  onCohortChange,
  onBmrChange,
  onDirChange,
  onExcludePassengersChange,
}: {
  atlas: Atlas;
  cohort: Cohort;
  bmr: Bmr;
  dir: DirFilter;
  excludePassengers: boolean;
  onCohortChange: (id: string) => void;
  onBmrChange: (b: Bmr) => void;
  onDirChange: (d: DirFilter) => void;
  onExcludePassengersChange: (next: boolean) => void;
}) {
  const counts = bmrCounts(cohort, bmr);
  const showCount = (d: DirFilter) => showCountOf(counts, d);

  return (
    <div className="space-y-control-row">
      <div className="flex flex-col gap-control-row sm:flex-row sm:flex-wrap sm:items-end">
        <Field label="Cohort" className="w-full sm:w-auto">
          <CohortCombobox atlas={atlas} value={cohort.id} onChange={onCohortChange} />
        </Field>

        <Field label="Background-rate model" className="w-full sm:w-auto">
          <Select value={bmr} onValueChange={(b) => onBmrChange(b as Bmr)}>
            <SelectTrigger className="control-width w-full sm:w-[var(--control-width)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {atlas.bmrs.map((b) => (
                <SelectItem key={b} value={b}>
                  <span className="font-mono">{BMR_LABEL[b]}</span>
                  <span className="ml-2 text-meta text-muted-foreground-strong">{BMR_SUB[b]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Show" className="w-full sm:w-auto">
          <Select value={dir} onValueChange={(d) => onDirChange(d as DirFilter)}>
            <SelectTrigger className="control-width w-full sm:w-[var(--control-width)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHOW_ORDER.map((d) => (
                <SelectItem key={d} value={d}>
                  <span className="flex w-full items-center justify-between gap-4">
                    <span>{SHOW_LABEL[d]}</span>
                    <span className="font-mono text-meta tnum text-muted-foreground-strong">
                      {fmtInt(showCount(d))}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Passenger-gene exclusion toggle */}
        <Field label="Likely-passenger genes" className="w-full sm:ml-auto sm:w-auto">
          <button
            type="button"
            role="switch"
            aria-checked={excludePassengers}
            onClick={() => onExcludePassengersChange(!excludePassengers)}
            className={cn(
              "focus-ring flex h-9 w-full items-center gap-2 rounded-md border border-border px-3 text-meta transition-colors sm:w-auto",
              excludePassengers
                ? "bg-white/[0.04] text-foreground hover:bg-white/[0.06]"
                : "bg-transparent text-muted-foreground-strong hover:bg-white/[0.04]",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                excludePassengers ? "bg-brand" : "bg-muted-foreground",
              )}
            />
            {excludePassengers ? "Excluded" : "Included"}
          </button>
        </Field>
      </div>

      <CohortMetaStrip cohort={cohort} />

      <EmptyStateRecovery
        atlas={atlas}
        cohort={cohort}
        bmr={bmr}
        dir={dir}
        onBmrChange={onBmrChange}
      />
    </div>
  );
}

/**
 * Labeled cohort meta: N (sample count) and TMB (median mut/Mb), each with an InfoTip, plus a
 * cBioPortal affordance. For non-TCGA cohorts the cBioPortal slot is kept but disabled and
 * explained (never silently omitted). Trailing: a copy-link button (the hash URL is shareable).
 * All text on the AA-strong gray token.
 */
function CohortMetaStrip({ cohort }: { cohort: Cohort }) {
  const hasCbio = cohort.study === "TCGA" && !!cohort.cbio;

  return (
    <div className="flex flex-wrap items-center gap-x-control-row gap-y-label border-t border-border pt-caption text-meta text-muted-foreground-strong">
      <span className="inline-flex items-center gap-intra">
        <span className="eyebrow">N</span>
        <span className="font-mono tnum text-foreground">{fmtInt(cohort.n_samples)}</span>
        <InfoTip label="About N" side="bottom">
          Samples (tumors) profiled in this cohort.
        </InfoTip>
      </span>

      <span className="inline-flex items-center gap-intra">
        <span className="eyebrow">TMB</span>
        <span className="font-mono tnum text-foreground">{cohort.median_tmb.toFixed(1)}</span>
        <span className="font-mono text-muted-foreground-strong">mut/Mb</span>
        <InfoTip label="About TMB" side="bottom">
          Median tumor mutational burden — somatic mutations per megabase, across the cohort.
        </InfoTip>
      </span>

      {hasCbio ? (
        <a
          href={cohort.cbio}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center gap-intra rounded-md text-muted-foreground-strong transition-colors hover:text-foreground"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          cBioPortal study
        </a>
      ) : (
        <span className="inline-flex items-center gap-intra text-muted-foreground-strong">
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="line-through decoration-from-font">cBioPortal</span>
          <span className="font-mono text-eyebrow uppercase tracking-[0.12em]">TCGA only</span>
          <InfoTip label="About cBioPortal availability" side="bottom">
            cBioPortal links are available for TCGA cohorts only; MSK study IDs are not yet
            confirmed.
          </InfoTip>
        </span>
      )}

      <CopyLinkButton className="sm:ml-auto" />
    </div>
  );
}

/** Copy the current shareable hash URL to the clipboard, with a brief confirmation. */
function CopyLinkButton({ className }: { className?: string }) {
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
      size="sm"
      onClick={copy}
      aria-label="Copy a shareable link to this view"
      className={cn("gap-intra px-2 text-meta", className)}
    >
      {copied ? (
        <Check className="size-3.5 text-brand" aria-hidden />
      ) : (
        <Link2 className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

/**
 * Actionable empty-state: when the selected model has no pairs in the chosen direction, surface
 * clickable chips for the models that DO have data ("CBaSE has 176 ME pairs →"), so recovery is
 * one click. Renders nothing when the current selection has data.
 */
function EmptyStateRecovery({
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
  if (showCountOf(bmrCounts(cohort, bmr), dir) > 0) return null;

  const alternatives = atlas.bmrs
    .filter((b) => b !== bmr)
    .map((b) => ({ bmr: b, n: showCountOf(bmrCounts(cohort, b), dir) }))
    .filter((a) => a.n > 0);

  const dirLabel = dir === "both" ? "" : `${dir} `;

  return (
    <div className="surface space-y-caption p-5 text-meta">
      <p className="text-muted-foreground-strong">
        <span className="font-mono text-foreground">{BMR_LABEL[bmr]}</span> has no{" "}
        {dir !== "both" ? <span className="font-mono">{dir} </span> : null}pairs for{" "}
        <span className="font-mono text-foreground">{cohort.cohort.replace(/_/g, " ")}</span> — try
        another background-rate model:
      </p>
      {alternatives.length > 0 ? (
        <div className="flex flex-wrap gap-label">
          {alternatives.map((a) => (
            <button
              key={a.bmr}
              type="button"
              onClick={() => onBmrChange(a.bmr)}
              className="focus-ring inline-flex items-center gap-intra rounded-md border border-border bg-white/[0.04] px-3 py-1.5 text-meta text-foreground transition-colors hover:bg-white/[0.06]"
            >
              <span className="font-mono">{BMR_LABEL[a.bmr]}</span>
              <span className="text-muted-foreground-strong">
                has <span className="font-mono tnum text-foreground">{fmtInt(a.n)}</span>{" "}
                {dirLabel}pairs
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground-strong" aria-hidden />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground-strong">
          No background-rate model has pairs for this cohort and filter
          {STUDY_LABEL[cohort.study] ? <> in {STUDY_LABEL[cohort.study]}</> : null}.
        </p>
      )}
    </div>
  );
}
