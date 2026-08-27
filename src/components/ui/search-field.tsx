import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className={cn("relative block min-w-0", className)}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
        className="pl-11 pr-10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="focus-ring absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"
          aria-label={`Clear ${label.toLowerCase()}`}
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </label>
  );
}
