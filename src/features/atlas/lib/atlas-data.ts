import { decodeCohort, decodeIndex, decodeManifest } from "@/features/atlas/lib/decode";
import type { CohortData, CohortMeta, ReleaseBundle } from "@/features/atlas/types";

export const RELEASE_SLUG = "k100-2026-08-26";
export const RELEASE_SCHEMA_VERSION = "2.0.0";
export const RELEASE_ROOT = `${import.meta.env.BASE_URL}data/releases/${RELEASE_SLUG}/`;
const COHORT_CACHE_LIMIT = 3;

let releaseValue: ReleaseBundle | null = null;
let releasePromise: Promise<ReleaseBundle> | null = null;
const cohortValues = new Map<string, CohortData>();
const cohortPromises = new Map<string, Promise<CohortData>>();

const relative = (path: string) => path.replace(/^\.\//, "").replace(/^\//, "");

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`);
  return response.json();
}

export function manifestUrl(): string {
  return `${RELEASE_ROOT}manifest.json`;
}

export async function loadRelease(): Promise<ReleaseBundle> {
  if (releaseValue) return releaseValue;
  if (releasePromise) return releasePromise;

  releasePromise = (async () => {
    const manifest = decodeManifest(await fetchJson(manifestUrl()));
    if (
      manifest.release_id !== RELEASE_SLUG ||
      manifest.schema_version !== RELEASE_SCHEMA_VERSION ||
      !manifest.immutable
    ) {
      throw new Error(
        `Unexpected release contract: ${manifest.release_id} schema ${manifest.schema_version}`,
      );
    }
    const indexUrl = `${RELEASE_ROOT}${relative(manifest.index_file)}`;
    const index = decodeIndex(await fetchJson(indexUrl));
    if (index.release_id !== manifest.release_id) {
      throw new Error(
        `Release mismatch: manifest ${manifest.release_id}, index ${index.release_id}`,
      );
    }
    const bundle = { manifest, index };
    releaseValue = bundle;
    return bundle;
  })().catch((error) => {
    releasePromise = null;
    throw error;
  });

  return releasePromise;
}

export async function loadCohort(meta: CohortMeta): Promise<CohortData> {
  const cached = cohortValues.get(meta.id);
  if (cached) return cached;
  const pending = cohortPromises.get(meta.id);
  if (pending) return pending;

  const promise = (async () => {
    const decoded = decodeCohort(await fetchJson(`${RELEASE_ROOT}${relative(meta.data_file)}`));
    if (decoded.id !== meta.id) {
      throw new Error(`Cohort mismatch: index ${meta.id}, file ${decoded.id}`);
    }
    cohortValues.delete(meta.id);
    cohortValues.set(meta.id, decoded);
    while (cohortValues.size > COHORT_CACHE_LIMIT) {
      const oldest = cohortValues.keys().next().value as string | undefined;
      if (!oldest) break;
      cohortValues.delete(oldest);
    }
    return decoded;
  })().finally(() => {
    // Do not let settled promises bypass the bounded decoded-cohort cache.
    cohortPromises.delete(meta.id);
  });
  cohortPromises.set(meta.id, promise);
  return promise;
}

export function indexUrl(bundle: ReleaseBundle): string {
  return `${RELEASE_ROOT}${relative(bundle.manifest.index_file)}`;
}

export function cohortUrl(meta: CohortMeta): string {
  return `${RELEASE_ROOT}${relative(meta.data_file)}`;
}

export function readmeUrl(bundle: ReleaseBundle): string {
  return `${RELEASE_ROOT}${relative(bundle.manifest.readme_file)}`;
}

/** Test/retry seam. A failed immutable fetch is never retained. */
export function clearAtlasCache(): void {
  releaseValue = null;
  releasePromise = null;
  cohortValues.clear();
  cohortPromises.clear();
}
