import * as React from "react";
import * as TG from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export interface SegOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  className,
  size = "default",
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: SegOption<T>[];
  className?: string;
  size?: "default" | "sm";
}) {
  return (
    <TG.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-white/[0.03] p-[3px]",
        className,
      )}
    >
      {options.map((o) => (
        <TG.Item
          key={o.value}
          value={o.value}
          className={cn(
            "focus-ring inline-flex items-center justify-center gap-1.5 rounded-[6px] font-medium text-muted-foreground-strong outline-none transition-colors",
            "hover:text-foreground",
            "data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-[var(--elev-highlight)]",
            size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3.5 text-[13px]",
          )}
        >
          {o.label}
        </TG.Item>
      ))}
    </TG.Root>
  );
}
