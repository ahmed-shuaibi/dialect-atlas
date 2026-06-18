import { BMR_LABEL, BMR_SUB, bmrCounts, type Atlas, type Bmr, type Cohort } from "@/lib/atlas";
import { cn, fmtInt } from "@/lib/utils";

function Count({ n, kind }: { n: number; kind: "me" | "co" }) {
  return (
    <div className="text-right">
      <div className={cn("font-mono text-lg leading-none tnum", kind === "me" ? "text-me" : "text-co")}>
        {fmtInt(n)}
      </div>
      <div className="eyebrow mt-1.5">{kind}</div>
    </div>
  );
}

/** The BMR selector AND the cross-BMR comparison in one: three model cards with ME/CO counts. */
export function CrossBmrStrip({
  atlas,
  cohort,
  bmr,
  onChange,
}: {
  atlas: Atlas;
  cohort: Cohort;
  bmr: Bmr;
  onChange: (b: Bmr) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {atlas.bmrs.map((b) => {
        const { ME, CO } = bmrCounts(cohort, b);
        const active = b === bmr;
        return (
          <button
            key={b}
            onClick={() => onChange(b)}
            aria-pressed={active}
            className={cn(
              "focus-ring surface flex items-center justify-between gap-3 px-4 py-3 text-left transition-all",
              active ? "border-brand/50 ring-1 ring-brand/40" : "opacity-80 hover:opacity-100",
            )}
          >
            <div>
              <div className={cn("font-mono text-sm", active ? "text-foreground" : "text-muted-foreground-strong")}>
                {BMR_LABEL[b]}
              </div>
              <div className="eyebrow mt-1.5">{BMR_SUB[b]}</div>
            </div>
            <div className="flex items-center gap-4">
              <Count n={ME} kind="me" />
              <Count n={CO} kind="co" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
