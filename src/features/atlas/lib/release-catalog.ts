import catalog from "@/features/atlas/release-catalog.json";
import type { AtlasMode, ReleaseCatalogEntry } from "@/features/atlas/types";

/** Every published immutable release, newest first. The site default is `DEFAULT_RELEASE_ID`. */
export const RELEASE_CATALOG = catalog.releases as ReleaseCatalogEntry[];
export const DEFAULT_RELEASE_ID: string = catalog.default;

export function releaseEntry(id: string | null | undefined): ReleaseCatalogEntry | undefined {
  return RELEASE_CATALOG.find((release) => release.id === id);
}

export function defaultReleaseEntry(): ReleaseCatalogEntry {
  const entry = releaseEntry(DEFAULT_RELEASE_ID);
  if (!entry) throw new Error(`Release catalog default ${DEFAULT_RELEASE_ID} is not listed`);
  return entry;
}

export function studyOfCohort(cohortId: string | undefined): string | undefined {
  return cohortId?.split("__", 1)[0] || undefined;
}

/**
 * Resolve the release for a URL. An explicit, known release wins. Otherwise the
 * default is used unless the requested cohort's study is only published in an older
 * release (so links to MSK cohorts keep opening the K=100 release).
 */
export function resolveRelease(
  requested: string | null | undefined,
  cohortId?: string,
): ReleaseCatalogEntry {
  const explicit = releaseEntry(requested);
  if (explicit) return explicit;
  const fallback = defaultReleaseEntry();
  const study = studyOfCohort(cohortId);
  if (!study || fallback.studies.includes(study)) return fallback;
  return RELEASE_CATALOG.find((release) => release.studies.includes(study)) ?? fallback;
}

export function defaultModeFor(entry: ReleaseCatalogEntry): AtlasMode {
  return entry.default_mode;
}

export function isColumnarRelease(entry: ReleaseCatalogEntry): boolean {
  return entry.schema_version === "3.0.0";
}

/** Releases that publish a study, other than the one given. */
export function otherReleasesWithStudy(entry: ReleaseCatalogEntry, study: string): ReleaseCatalogEntry[] {
  return RELEASE_CATALOG.filter((release) => release.id !== entry.id && release.studies.includes(study));
}
