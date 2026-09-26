import { SegmentedControl } from "@/components/ui/segmented-control";
import { RELEASE_CATALOG } from "@/features/atlas/lib/release-catalog";
import type { ReleaseCatalogEntry } from "@/features/atlas/types";

const OPTIONS = RELEASE_CATALOG.map((release) => ({ value: release.id, label: release.label }));

export function ReleaseSwitch({
  release,
  onChange,
  className,
}: {
  release: ReleaseCatalogEntry;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <SegmentedControl
        value={release.id}
        options={OPTIONS}
        onChange={onChange}
        label="Atlas release"
      />
      <p className="mt-2 text-sm text-muted">{release.description}</p>
    </div>
  );
}
