import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ResultsToolbar({
  controls,
  search,
  customize,
  className,
}: {
  controls: ReactNode;
  search: ReactNode;
  customize: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 rounded-[22px] border border-line bg-paper/65 p-2.5 shadow-sm sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">{controls}</div>
      <div className="min-w-0 flex-1 sm:max-w-72">{search}</div>
      <div className="sm:ml-auto">{customize}</div>
    </div>
  );
}
