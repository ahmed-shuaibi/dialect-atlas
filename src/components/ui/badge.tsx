import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap font-mono text-eyebrow font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        default:
          "rounded-md border border-border bg-white/[0.04] px-2 py-1 text-muted-foreground-strong",
        count: "rounded-md bg-white/[0.05] px-1.5 py-0.5 text-muted-foreground-strong",
        /* ME / CO encode redundantly: hue AND solid-vs-dashed border (colorblind-safe).
           The leading swatch repeats the solid/dashed cue for grayscale-PDF safety. */
        me: "rounded-md border border-solid border-me/45 bg-me/10 px-1.5 py-0.5 text-me",
        co: "rounded-md border border-dashed border-co/55 bg-co/10 px-1.5 py-0.5 text-co",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/* Redundant solid/dashed swatch for the ME/CO badges + legend — pair with the
   `me`/`co` badge variants (or use standalone in the legend). */
export function EdgeSwatch({
  type,
  className,
}: {
  type: "ME" | "CO";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-0 w-3.5 align-middle", className)}
      style={{
        borderTopWidth: 2,
        borderTopStyle: type === "ME" ? "solid" : "dashed",
        borderTopColor: type === "ME" ? "var(--me-color)" : "var(--co-color)",
      }}
    />
  );
}
