import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper hover:bg-ink/88",
        outline: "border border-line bg-paper text-ink hover:border-ink/30 hover:bg-white",
        ghost: "text-muted hover:bg-ink/[0.055] hover:text-ink",
        soft: "bg-sand text-ink hover:bg-sand-deep",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-4 text-xs",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
