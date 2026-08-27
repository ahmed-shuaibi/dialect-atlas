import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "focus-ring h-11 w-full min-w-0 rounded-full border border-transparent bg-paper/80 px-4 text-[15px] font-medium text-ink shadow-sm outline-none transition-[background-color,border-color] placeholder:text-muted/75 hover:border-line focus:border-brand focus:bg-paper",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
