# Custom-domain deployment

`https://dialectcanceratlas.com` is the canonical DIALECT Atlas URL. GitHub
Pages hosts the static application; Cloudflare is the authoritative DNS
provider. Keep the GitHub Pages release data immutable.

## Production contract

- Canonical host: `dialectcanceratlas.com`
- Alternate host: `www.dialectcanceratlas.com` redirects to the apex
- Build base: `/`
- Hosting: GitHub Pages via `.github/workflows/deploy.yml`
- DNS: Cloudflare, DNS-only during launch
- TLS: GitHub Pages / Let's Encrypt

The Actions-based Pages deployment does not use a repository `CNAME` file.
Set the custom domain in GitHub repository **Settings → Pages** or through the
GitHub Pages API.

## Domain verification

Before routing traffic, add `dialectcanceratlas.com` in GitHub account
**Settings → Pages**. GitHub provides a token for this permanent Cloudflare
TXT record:

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| TXT | `_github-pages-challenge-ahmed-shuaibi` | GitHub-generated token | DNS only |

Retain the TXT record after verification. Never commit the verification token.

## Routing records

Configure the custom domain in the repository's Pages settings before adding
these Cloudflare records:

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| A | `@` | `185.199.108.153` | DNS only |
| A | `@` | `185.199.109.153` | DNS only |
| A | `@` | `185.199.110.153` | DNS only |
| A | `@` | `185.199.111.153` | DNS only |
| CNAME | `www` | `ahmed-shuaibi.github.io` | DNS only |

Do not include `/dialect-atlas` in DNS targets. Do not create wildcard records,
an apex CNAME, a `www` redirect rule, or conflicting A/AAAA records. CAA is not
required. If CAA is introduced later, it must permit `letsencrypt.org`.

## Cutover

1. Verify the domain in the GitHub account with the permanent TXT record.
2. Set the repository Pages custom domain to `dialectcanceratlas.com`.
3. Deploy `main`; the workflow builds and validates root-domain assets.
4. Add the four apex A records and the `www` CNAME in Cloudflare.
5. Wait for the Pages DNS check and certificate issuance.
6. Enable **Enforce HTTPS** in GitHub Pages.
7. Verify the apex, `www` redirect, old `github.io` redirect, metadata, assets,
   immutable release files, Explore, Compare, and browser console.

Leave Cloudflare proxying disabled unless a separate, tested proxy migration is
required. If proxying is later enabled, first confirm the GitHub origin
certificate and Cloudflare Universal SSL are active, use **Full (strict)**, and
never use **Flexible**.

## Local release checks

```bash
npm run check
npm run build
```

`npm run build` fails if the canonical metadata, root asset paths, brand files,
SEO files, or immutable release entry points are missing or stale.

## Rollback

If cutover fails, remove the custom domain from GitHub Pages, restore the
previous `ATLAS_SITE_URL` and `ATLAS_BASE_PATH` build configuration, deploy the
last known-good commit, and only then remove the Cloudflare routing records.
