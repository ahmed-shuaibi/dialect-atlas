import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SectionHeader — the one numbered section header (REDESIGN2 §4/§5).
 *
 * Renders a mono, wide-tracked, numbered eyebrow (`01 / network`,
 * `02 / ranked pairs`) followed by a hairline rule, with an optional serif
 * title beneath and an optional trailing kicker (count, action, caption).
 * Ported from `life/site`'s Eyebrow + Divider — every section routes through
 * this ONE derived scale so headings stop drifting into ad-hoc
 * `font-serif text-h2` / bare `.eyebrow`.
 *
 * Tokens only: `.eyebrow` (mono 12 / 0.22em / uppercase / AA-safe stronger),
 * `.hairline` (1px white/7% rule), `text-h1|text-h2` + `--font-serif` for the
 * title, `--foreground` for heading ink. No drop shadows, no ad-hoc sizes.
 *
 * @example
 *   <SectionHeader index={1} label="network" />
 *   <SectionHeader index={2} label="ranked pairs" kicker="24 pairs" />
 *   <SectionHeader index={0} label="dialect atlas" title="Mutually exclusive & co-occurring drivers" />
 */

export interface SectionHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Section number — rendered zero-padded to two digits (`1` → `01`). */
  index: number;
  /** Section label after the slash (`network`, `ranked pairs`). Mono/uppercase. */
  label: React.ReactNode;
  /** Optional serif title rendered under the eyebrow row. One line. */
  title?: React.ReactNode;
  /** Semantic tag for `title` — styling is fixed; only the element changes. */
  titleAs?: "h1" | "h2" | "h3";
  /** Fixed serif scale for `title`. Defaults to `h2` (section-level). */
  size?: "h1" | "h2";
  /** Optional trailing content on the eyebrow row (count, caption, action). */
  kicker?: React.ReactNode;
}

export function SectionHeader({
  index,
  label,
  title,
  titleAs = "h2",
  size = "h2",
  kicker,
  className,
  ...props
}: SectionHeaderProps) {
  const num = String(index).padStart(2, "0");
  const TitleTag = titleAs;

  return (
    <div className={cn("w-full", className)} {...props}>
      {/* eyebrow row: number / label ───── hairline ───── kicker */}
      <div className="flex items-center gap-4">
        <p className="eyebrow flex shrink-0 items-center gap-2">
          <span>{num}</span>
          <span aria-hidden className="opacity-50">
            /
          </span>
          <span>{label}</span>
        </p>
        <span aria-hidden className="hairline flex-1" />
        {kicker != null && (
          <span className="shrink-0 font-mono text-meta tabular-nums text-muted-foreground-strong">
            {kicker}
          </span>
        )}
      </div>

      {title != null && (
        <TitleTag
          className={cn(
            "mt-label font-serif tracking-tight text-foreground",
            size === "h1" ? "text-h1" : "text-h2",
          )}
        >
          {title}
        </TitleTag>
      )}
    </div>
  );
}
