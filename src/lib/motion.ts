/**
 * Atlas motion — single source of truth.
 *
 * Policy (CLAUDE.md "minimal/no animation"; REDESIGN2 §5):
 *   - Motion is limited to dropdown / popover / row fades: opacity + scale(.95)
 *     on `data-open` / `data-closed` (or Radix `data-state`) transitions.
 *   - The Cytoscape layout stays `fcose animate:false`. No layout/position
 *     tweening, no drop-shadow motion, no bespoke keyframes.
 *   - Every duration / easing consumed anywhere must come from here so the whole
 *     page eases as one system. No literal cubic-bezier arrays or ad-hoc `0.2s`
 *     scattered in components.
 *
 * Atlas has no `motion` runtime dependency, so these are plain values: the tuple
 * for anyone who later wires the `motion` lib, and CSS-ready strings (`css.*`)
 * for `data-*` transitions and Tailwind arbitrary values today. Do NOT add a
 * heavy animation dep to consume this — CSS transitions are enough.
 */

/** easeOutExpo — the signature reveal curve, ported from life/site. */
export const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: "easeInOut" as const,
  linear: "linear" as const,
} as const;

/** Duration scale, seconds. Small + tasteful; fades only. */
export const dur = {
  fast: 0.12,
  base: 0.18,
  slow: 0.28,
} as const;

/**
 * Spring preset with `bounce: 0` — critically-damped, no overshoot. Shape
 * matches the `motion` lib's `Transition` so it drops in if that dep is ever
 * added; unused by the CSS path today.
 */
export const spring = {
  type: "spring" as const,
  bounce: 0,
  duration: dur.base,
} as const;

/** CSS-ready strings for `data-open`/`data-closed` (or Radix `data-state`) transitions. */
export const css = {
  /** `cubic-bezier(...)` form of `ease.out`, for the `transition-timing-function`. */
  easeOut: `cubic-bezier(${ease.out.join(", ")})`,
  /** Durations as `<n>ms` strings. */
  durMs: {
    fast: `${Math.round(dur.fast * 1000)}ms`,
    base: `${Math.round(dur.base * 1000)}ms`,
    slow: `${Math.round(dur.slow * 1000)}ms`,
  },
  /** The one shared fade: opacity + scale(.95), base duration on the signature curve. */
  fade: `opacity ${Math.round(dur.base * 1000)}ms cubic-bezier(${ease.out.join(
    ", ",
  )}), transform ${Math.round(dur.base * 1000)}ms cubic-bezier(${ease.out.join(", ")})`,
} as const;
