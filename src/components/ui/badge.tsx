import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap font-mono text-[11px] font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        default: "rounded-full border border-border bg-white/[0.04] px-2 py-1 text-muted-foreground-strong",
        count: "rounded-md bg-white/[0.05] px-1.5 py-0.5 text-muted-foreground-strong",
        me: "rounded-md border border-me/30 bg-me/10 px-1.5 py-0.5 text-me",
        co: "rounded-md border border-co/30 bg-co/10 px-1.5 py-0.5 text-co",
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
