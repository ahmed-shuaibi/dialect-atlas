import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import { CohortCombobox } from "@/components/CohortCombobox";
import { CrossBmrStrip } from "@/components/CrossBmrStrip";
import { NetworkView, type NetSelection } from "@/components/NetworkView";
import { PairDetail } from "@/components/PairDetail";
import { ResultTable } from "@/components/ResultTable";
import { Segmented, type SegOption } from "@/components/ui/segmented";
import {
  buildElements,
  loadAtlas,
  tableRows,
  type Atlas,
  type Bmr,
  type DirFilter,
} from "@/lib/atlas";
import { useHashState } from "@/lib/useHashState";
import { fmtInt } from "@/lib/utils";

const Dot = ({ c }: { c: string }) => (
  <span className="size-2 rounded-full" style={{ background: c }} />
);

const DIR_OPTS: SegOption<DirFilter>[] = [
  { value: "both", label: "Both" },
  { value: "ME", label: <span className="flex items-center gap-1.5"><Dot c="var(--me-color)" /> ME</span> },
  { value: "CO", label: <span className="flex items-center gap-1.5"><Dot c="var(--co-color)" /> CO</span> },
];
const TOPK_OPTS: SegOption<string>[] = ["10", "15", "25", "50"].map((v) => ({ value: v, label: v }));

function ControlLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="eyebrow hidden sm:inline">{label}</span>
      {children}
    </div>
  );
}

function SectionHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <span className="eyebrow shrink-0">
        {n} / {title}
      </span>
      <div className="hairline flex-1" />
    </div>
  );
}

export function App() {
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [hash, setHash] = useHashState({ c: "TCGA__BRCA", b: "cbase", d: "both", k: "15" });
  const [selected, setSelected] = useState<NetSelection | null>(null);

  useEffect(() => {
    loadAtlas().then(setAtlas).catch((e) => setErr(String(e)));
  }, []);

  const onSelect = useCallback((s: NetSelection | null) => setSelected(s), []);

  // clear selection when the underlying view changes
  useEffect(() => setSelected(null), [hash.c, hash.b, hash.d]);

  const view = useMemo(() => {
    if (!atlas) return null;
    const cohort = atlas.cohorts.find((c) => c.id === hash.c) ?? atlas.cohorts[0];
    const bmr = (atlas.bmrs.includes(hash.b as Bmr) ? hash.b : "cbase") as Bmr;
    const dir = (["both", "ME", "CO"].includes(hash.d) ? hash.d : "both") as DirFilter;
    const topk = Number(hash.k) || 15;
    const net = buildElements(cohort, bmr, dir, topk);
    const rows = tableRows(cohort, bmr, dir, topk);
    return { cohort, bmr, dir, topk, net, rows };
  }, [atlas, hash]);

  const selectedEdge = useMemo(() => {
    if (!view || !selected) return null;
    const dd = view.cohort.bmrs[view.bmr]?.[selected.type];
    if (!dd) return null;
    const key = [selected.a, selected.b].sort().join("|");
    const e = dd.edges.find((x) => [x.a, x.b].sort().join("|") === key);
    return e ? { ...e, type: selected.type } : null;
  }, [view, selected]);

  if (err) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Failed to load atlas data. <br /> {err}
      </div>
    );
  }
  if (!atlas || !view) {
    return (
      <>
        <SiteNav />
        <div className="mx-auto max-w-[1640px] space-y-3 px-5 py-10">
          <div className="h-9 w-72 animate-pulse rounded-md bg-white/[0.04]" />
          <div className="grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
            ))}
          </div>
          <div className="h-[520px] animate-pulse rounded-xl bg-white/[0.03]" />
        </div>
      </>
    );
  }

  const { cohort, bmr, dir, topk, net, rows } = view;

  return (
    <>
      <SiteNav />

      <main>
        {/* Hero — compact: mono eyebrow + modest serif title (critique: no giant H1 here) */}
        <div className="mx-auto max-w-[1640px] px-5 pt-10">
          <div className="eyebrow mb-3">driver interaction atlas</div>
          <h1 className="max-w-3xl font-serif text-[28px] leading-tight tracking-tight text-foreground md:text-[34px]">
            Mutual-exclusivity &amp; co-occurrence of driver mutations
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground-strong">
            Networks inferred by DIALECT across {atlas.cohorts.length} cancer cohorts and three
            background-mutation-rate models. Switch the model to see how the dependencies hold up.
          </p>
        </div>

        {/* Sticky control bar */}
        <div className="sticky top-14 z-30 mt-7 border-y border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1640px] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
            <CohortCombobox atlas={atlas} value={cohort.id} onChange={(c) => setHash({ c })} />
            <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
              <span className="tnum">N={fmtInt(cohort.n_samples)}</span>
              <span className="text-border">·</span>
              <span className="tnum">TMB {cohort.median_tmb}</span>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-3">
              <ControlLabel label="show">
                <Segmented value={dir} onValueChange={(d) => setHash({ d })} options={DIR_OPTS} />
              </ControlLabel>
              <ControlLabel label="top-K">
                <Segmented
                  size="sm"
                  value={String(topk)}
                  onValueChange={(k) => setHash({ k })}
                  options={TOPK_OPTS}
                />
              </ControlLabel>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1640px] px-5">
          {/* BMR comparison + selector */}
          <div className="pt-6">
            <SectionHead n="01" title="background-mutation-rate model" />
            <CrossBmrStrip atlas={atlas} cohort={cohort} bmr={bmr} onChange={(b) => setHash({ b })} />
          </div>

          {/* Network + inspector */}
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {net.empty ? (
                <div className="canvas-surface flex h-[600px] flex-col items-center justify-center gap-2 p-8 text-center">
                  <p className="font-serif text-lg text-foreground">No dependencies to show</p>
                  <p className="max-w-[40ch] text-sm text-muted-foreground">
                    {cohort.cohort.replace(/_/g, " ")} has no{" "}
                    {dir === "both" ? "ME/CO" : dir} pairs under {bmr.toUpperCase()} after the
                    ε-filter. Try another BMR model or direction.
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
            <div className="min-h-[600px] lg:col-span-1">
              <PairDetail pair={selectedEdge} cohort={cohort} bmr={bmr} />
            </div>
          </div>

          {/* Ranked dependencies table */}
          <div className="pt-10">
            <SectionHead n="02" title="ranked dependencies" />
            <ResultTable
              key={dir}
              rows={rows}
              selected={selected}
              onSelect={onSelect}
              defaultSort={dir === "ME" ? { key: "rho", dir: "asc" } : { key: "lrt", dir: "desc" }}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
