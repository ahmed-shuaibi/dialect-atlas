# Custom-domain deployment

`https://dialectcanceratlas.com` is the canonical DIALECT Atlas URL. Cloudflare
Pages builds and serves the static application from the GitHub repository;
GitHub Pages is retired.

## Production contract

- Cloudflare Pages project: `dialect-cancer-atlas`
- Production branch: `main`
- Canonical host: `dialectcanceratlas.com`
- Alternate host: `www.dialectcanceratlas.com` (permanent redirect to the apex)
- Pages hostname: `dialect-cancer-atlas.pages.dev` (permanent canonical redirect)
- Build command: `npm run build`
- Build output: `dist`
- Root directory: repository root
- Runtime: Node.js 24
- Build variables: `ATLAS_BASE_PATH=/` and
  `ATLAS_SITE_URL=https://dialectcanceratlas.com`

Cloudflare's Git integration deploys `main`. `.github/workflows/ci.yml` runs the
independent audit, test, typecheck, lint, release-validation, and production-build
gates; it has no deployment permissions or Pages actions.

## Domains and DNS

Attach both custom domains to the `dialect-cancer-atlas` Pages project. The zone
uses proxied CNAME records managed through Cloudflare:

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| CNAME | `@` | `dialect-cancer-atlas.pages.dev` | Proxied |
| CNAME | `www` | `dialect-cancer-atlas.pages.dev` | Proxied |

Do not restore the former GitHub Pages A records, `ahmed-shuaibi.github.io`
CNAME, or GitHub domain-verification TXT record. Do not create wildcard or
conflicting A/AAAA records.

Cloudflare terminates TLS for the apex, `www`, and the Pages hostname. Keep SSL/TLS
mode at **Full (strict)**; never use **Flexible**.

## Canonical redirects

Keep two active Cloudflare rules:

1. A zone Single Redirect named `redirect www to apex` sends
   `https://www.dialectcanceratlas.com/*` to
   `https://dialectcanceratlas.com/${1}` with status 301 and preserves the query
   string.
2. An account Bulk Redirect list named `dialect_atlas_canonical` sends
   `https://dialect-cancer-atlas.pages.dev/` to
   `https://dialectcanceratlas.com/` with status 301. Enable subpath matching,
   preserve the path suffix, and preserve the query string. Keep the Bulk Redirect
   Rule that references this list active.

The redirects must preserve both paths and query strings. Versioned preview
hostnames remain non-canonical and receive `X-Robots-Tag: noindex` from
`public/_headers`.

## Headers and caching

`public/_headers` is copied into `dist` and is the source of truth for Cloudflare
response headers. It provides the content security policy and related browser
protections, immutable one-year caching for fingerprinted assets and the frozen
K=100 release, and `noindex` for `pages.dev` hosts. Keep HTML outside the immutable
cache rules so a rollback takes effect immediately.

`npm run build` runs `scripts/validate-deployment.mjs` after Vite and fails if the
canonical metadata, root asset paths, required security headers, SEO files, or
immutable release entry points are missing or stale.

## Release and verification

1. Push the reviewed commit to `main`.
2. Confirm GitHub Actions `Atlas CI` succeeds.
3. Confirm the Cloudflare Pages production deployment for that commit succeeds.
4. Verify the apex returns 200 and the expected security headers.
5. Verify an immutable cohort file returns 200 with
   `Cache-Control: public, max-age=31556952, immutable`.
6. Verify `www` and the project `pages.dev` hostname return 301 while preserving a
   test path and query string.
7. Exercise Explore, Compare, the network, dark mode, and pair detail at the apex;
   confirm the browser console is clean.

Local equivalents for the repository gates are:

```bash
npm ci
npm audit --audit-level=high
npm run check
ATLAS_BASE_PATH=/ ATLAS_SITE_URL=https://dialectcanceratlas.com npm run build
```

## Rollback

For an application regression, use the Cloudflare Pages deployment history to
roll back production to the last verified successful deployment. Keep the custom
domains and redirect rules in place, then repeat the live checks above.

For a Cloudflare Pages service migration, first deploy and verify the fallback host,
then repoint both custom domains and update both canonical redirect rules as one
cutover. Do not delete the Pages project, custom domains, DNS records, or immutable
release data until the fallback serves the complete Atlas and rollback DNS has been
recorded.

GitHub Pages must remain disabled. The legacy `github.io/dialect-atlas` URL is not a
rollback target and must not appear in production metadata.
