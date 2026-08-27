import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,border-color,color,transform] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper hover:opacity-88",
        outline: "border border-line bg-paper text-ink shadow-sm hover:border-ink/30 hover:bg-sand",
        ghost: "border border-transparent text-muted hover:border-line hover:bg-paper hover:text-ink",
        soft: "bg-sand text-ink hover:bg-sand-deep",
        filter: "border border-line bg-paper text-muted shadow-sm hover:border-ink/30 hover:text-ink aria-pressed:border-support/30 aria-pressed:bg-support-soft aria-pressed:text-support",
      },
      size: {
        default: "h-11 px-5 text-[15px]",
        sm: "h-10 px-4 text-sm",
        header: "h-12 px-5 text-[15px]",
        icon: "size-10 p-0",
        "icon-sm": "size-9 p-0",
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
