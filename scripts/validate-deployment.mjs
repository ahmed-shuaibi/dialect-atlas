import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const DIST = path.join(ROOT, "dist");
const RELEASE = "k100-2026-08-26";
const DEFAULT_SITE_URL = "https://dialectcanceratlas.com";

const siteUrl = (process.env.ATLAS_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");
const rawBasePath = process.env.ATLAS_BASE_PATH ?? "/";
const strippedBasePath = rawBasePath.replace(/^\/+|\/+$/g, "");
const basePath = strippedBasePath === "" ? "/" : `/${strippedBasePath}/`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertFile(relativePath) {
  await access(path.join(DIST, relativePath));
}

const html = await readFile(path.join(DIST, "index.html"), "utf8");

assert(
  html.includes(`<link rel="canonical" href="${siteUrl}/"`),
  `canonical URL must be ${siteUrl}/`,
);
assert(
  html.includes(`<meta property="og:url" content="${siteUrl}/"`),
  `Open Graph URL must be ${siteUrl}/`,
);
assert(
  html.includes(`content="${siteUrl}/brand/dialect-mark.png"`),
  "Open Graph image must use the production origin",
);
assert(!html.includes("__ATLAS_SITE_URL__"), "site URL placeholder leaked into dist/index.html");
assert(
  !html.includes("ahmed-shuaibi.github.io/dialect-atlas"),
  "legacy GitHub Pages origin leaked into dist/index.html",
);
assert(
  html.includes(`src="${basePath}assets/`) && html.includes(`href="${basePath}assets/`),
  `JavaScript and CSS assets must use base path ${basePath}`,
);

await Promise.all([
  assertFile("brand/dialect-icon.png"),
  assertFile("brand/dialect-mark.png"),
  assertFile("brand/dialect-wordmark.png"),
  assertFile("robots.txt"),
  assertFile("sitemap.xml"),
  assertFile(`data/releases/${RELEASE}/manifest.json`),
  assertFile(`data/releases/${RELEASE}/index.json`),
  assertFile(`data/releases/${RELEASE}/cohorts/TCGA__CHOL.json`),
]);

const robots = await readFile(path.join(DIST, "robots.txt"), "utf8");
const sitemap = await readFile(path.join(DIST, "sitemap.xml"), "utf8");
assert(robots.includes(`${DEFAULT_SITE_URL}/sitemap.xml`), "robots.txt sitemap URL is stale");
assert(sitemap.includes(`<loc>${DEFAULT_SITE_URL}/</loc>`), "sitemap canonical URL is stale");

process.stdout.write(`Deployment valid for ${siteUrl}${basePath}\n`);
