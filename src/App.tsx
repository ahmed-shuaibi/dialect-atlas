import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import { CohortCombobox } from "@/components/CohortCombobox";
import { NetworkView, type NetSelection } from "@/components/NetworkView";
import { ResultTable } from "@/components/ResultTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  BMR_LABEL,
  bmrCounts,
  buildElements,
  loadAtlas,
  tableRows,
  type Atlas,
  type Bmr,
  type DirFilter,
} from "@/lib/atlas";
import { useHashState } from "@/lib/useHashState";
import { fmtInt } from "@/lib/utils";

const TOPK = 25;
const SHOW_LABEL: Record<DirFilter, string> = {
  both: "Both",
  ME: "Mutually exclusive",
  CO: "Co-occurring",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

export function App() {
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [hash, setHash] = useHashState({ c: "TCGA__BRCA", b: "cbase", d: "both" });
  const [selected, setSelected] = useState<NetSelection | null>(null);

  useEffect(() => {
    loadAtlas().then(setAtlas).catch((e) => setErr(String(e)));
  }, []);

  const onSelect = useCallback((s: NetSelection | null) => setSelected(s), []);
  useEffect(() => setSelected(null), [hash.c, hash.b, hash.d]);

  const view = useMemo(() => {
    if (!atlas) return null;
    const cohort = atlas.cohorts.find((c) => c.id === hash.c) ?? atlas.cohorts[0];
    const bmr = (atlas.bmrs.includes(hash.b as Bmr) ? hash.b : "cbase") as Bmr;
    const dir = (["both", "ME", "CO"].includes(hash.d) ? hash.d : "both") as DirFilter;
    return {
      cohort,
      bmr,
      dir,
      net: buildElements(cohort, bmr, dir, TOPK),
      rows: tableRows(cohort, bmr, dir, TOPK),
    };
  }, [atlas, hash]);

  if (err) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Failed to load atlas data.
      </div>
    );
  }
  if (!atlas || !view) {
    return (
      <>
        <SiteNav />
        <div className="mx-auto max-w-[1400px] space-y-4 px-5 py-12">
          <div className="h-9 w-80 animate-pulse rounded-md bg-white/[0.04]" />
          <div className="h-[600px] animate-pulse rounded-xl bg-white/[0.03]" />
        </div>
      </>
    );
  }

  const { cohort, bmr, dir, net, rows } = view;
  const cmpDir: "ME" | "CO" = dir === "ME" ? "ME" : "CO";

  return (
    <TooltipProvider delayDuration={150}>
      <SiteNav />
      <main className="mx-auto max-w-[1400px] px-5 pb-16">
        <h1 className="pt-9 pb-6 font-serif text-[26px] leading-tight tracking-tight text-foreground">
          Mutual exclusivity &amp; co-occurrence of driver mutations
        </h1>

        {/* Controls — three consistent dropdowns */}
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Cohort">
            <CohortCombobox atlas={atlas} value={cohort.id} onChange={(c) => setHash({ c })} />
          </Field>
          <Field label="Background rate model">
            <Select value={bmr} onValueChange={(b) => setHash({ b })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {atlas.bmrs.map((b) => (
                  <SelectItem key={b} value={b}>
                    {BMR_LABEL[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Show">
            <Select value={dir} onValueChange={(d) => setHash({ d })}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["both", "ME", "CO"] as DirFilter[]).map((d) => (
                  <SelectItem key={d} value={d}>
                    {SHOW_LABEL[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="ml-auto flex items-center gap-3 pb-2 text-xs text-muted-foreground">
            <span className="font-mono tnum">N {fmtInt(cohort.n_samples)}</span>
            <span className="text-border">·</span>
            <span className="font-mono tnum">TMB {cohort.median_tmb}</span>
            {cohort.cbio && (
              <>
                <span className="text-border">·</span>
                <a
                  href={cohort.cbio}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex items-center gap-1 rounded text-muted-foreground-strong transition-colors hover:text-foreground"
                >
                  cBioPortal <ExternalLink className="size-3" />
                </a>
              </>
            )}
          </div>
        </div>

        {/* One-line cross-model comparison */}
        <p className="mt-4 text-xs text-muted-foreground">
          {SHOW_LABEL[cmpDir]} pairs by model:{" "}
          {atlas.bmrs.map((b, i) => (
            <span key={b}>
              {i > 0 && <span className="text-border"> · </span>}
              <span className={b === bmr ? "font-mono tnum text-foreground" : "font-mono tnum"}>
                {BMR_LABEL[b]} {fmtInt(bmrCounts(cohort, b)[cmpDir])}
              </span>
            </span>
          ))}
        </p>

        {/* Network */}
        <div className="mt-5">
          {net.empty ? (
            <div className="canvas-surface flex h-[600px] flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="font-serif text-lg text-foreground">No dependencies to show</p>
              <p className="max-w-[40ch] text-sm text-muted-foreground">
                Try another model or change the Show filter.
              </p>
            </div>
          ) : (
            <NetworkView
              elements={net.elements}
              minW={net.minW}
              maxW={net.maxW}
              selected={selected}
              onSelect={onSelect}
            />
          )}
        </div>

        {/* Ranked dependencies */}
        <div className="mt-10">
          <div className="eyebrow mb-3">ranked dependencies</div>
          <ResultTable
            key={dir}
            rows={rows}
            selected={selected}
            onSelect={onSelect}
            defaultSort={dir === "ME" ? { key: "rho", dir: "asc" } : { key: "lrt", dir: "desc" }}
          />
        </div>
      </main>
      <Footer />
    </TooltipProvider>
  );
}
