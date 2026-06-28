import type { ReactNode } from "react";

/**
 * Labeled control wrapper used by AtlasControls. Mono eyebrow label above the control,
 * 8px (label token) gap. Renders a <div> (not <label>) so it can wrap composite triggers
 * like the combobox without nesting interactive elements inside a <label>.
 */
export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  /** Optional id of the control this labels (for the visually-styled label↔control link). */
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="eyebrow mb-label block">
        {label}
      </label>
      {children}
    </div>
  );
}
