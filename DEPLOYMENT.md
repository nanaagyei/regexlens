# RegexLens Deployment & CI/CD

This document covers cloud database setup (Neon Postgres), branch strategy, CI/CD workflows, and release automation.

---

## Branch Strategy


| Branch   | Purpose                                                                              |
| -------- | ------------------------------------------------------------------------------------ |
| **dev**  | Default branch for feature work. All CI checks run on every push and on PRs.         |
| **main** | Protected. Only merge from dev after checks pass. Production deploys only from main. |


**Flow:** `dev` → Pull Request (checks pass) → `main` → Vercel Production

**Releases:** Tag `main` after merge when cutting a release (e.g. `v1.0.0`).

---

## GitHub Branch Protection (main)

Configure in **Settings → Branches → Add branch protection rules** for `main` and (recommended) `dev`:

- **Require a pull request before merging** (at least for `main`)
- **Require status checks to pass** before merge (from workflow **CI** / `ci.yml`): `lint`, `typecheck`, `test`, `build`, `e2e`, and optionally `security`
- **Require branches to be up to date** before merging
- **Restrict who can push** to `main` (or require PR only from `dev`)

Enable **Secret scanning** and **Push protection** for the repository under **Settings → Code security and analysis**.

---

## Cloud Database: Neon Postgres

RegexLens uses PostgreSQL via `pg` and `@auth/pg-adapter`. For Vercel deployment, **Neon** is recommended.

### Setup Steps

1. **Create Neon project** at [neon.tech](https://neon.tech)
2. **Install "Neon" from Vercel Marketplace** — links project automatically and sets `DATABASE_URL`
3. **Run schema:** In Neon SQL Editor, execute the contents of `docker/init.sql`
  - Or from local: `psql $DATABASE_URL -f docker/init.sql`
4. **Environment variables** — `DATABASE_URL` is auto-set by the Vercel integration; add `AUTH_*` as needed

### Why Neon

- One-click connect from Vercel dashboard
- Connection string works with existing `DATABASE_URL` + `pg` pool
- No code changes required
- Free tier: 512 MB storage, ~192 compute hrs/mo

---

## CI/CD Workflows

### CI (`ci.yml`)

**Triggers:** Push to `dev` or `main`, and pull requests targeting `dev` or `main`

**Jobs:** `lint`, `typecheck`, `test` (Vitest + coverage), `build`, `e2e` (Playwright), `security` (`npm audit --audit-level=high`)

**Database in CI:** A placeholder `DATABASE_URL` is used (`postgresql://user:pass@localhost:5432/db`) since the build may import server modules. Vercel build uses the real env from project settings.

### Security (`security.yml`)

**Triggers:** Weekly cron (Sunday midnight UTC), push to `main`

**Jobs:** `npm audit --audit-level=high`

### Release (`release.yml`)

**Triggers:** Manual via `workflow_dispatch` (Actions → Release → Run workflow)

**Inputs:** `major` | `minor` | `patch`

**Actions:** Bumps version with `npm version`, commits, tags `vX.Y.Z`, pushes to `main`

**Note:** Run only from `main` branch after merging your release-ready code.

---

## Vercel Project Settings

- **Production branch:** `main`
- **Preview deployments:** All Git branches, or treat `**dev`** as the primary staging branch (merge previews before promoting to `main`)
- **Environment variables:** `DATABASE_URL` (from Neon), `AUTH_*`, `AUTH_URL` / `NEXTAUTH_URL` (canonical origin for OAuth redirects), `KV_*`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DOCS_URL`, observability flags (`NEXT_PUBLIC_VERCEL_ANALYTICS`, optional ad flags), etc.

### Vercel + GitHub checklist (manual)

1. **Connect the GitHub repo** to a Vercel project and import this Next.js app root.
2. **Set Production branch** to `main` (Project → Settings → Git).
3. **Attach Neon** via Vercel Marketplace or paste `DATABASE_URL` for Preview and Production (use separate Neon branches if you want isolated preview data).
4. **Copy env vars** from `.env.example` into Vercel (Production + Preview); never commit real secrets.
5. **Protect `main`** in GitHub as above so only green CI can merge.
6. After connect, confirm **Preview** URL for `dev` and **Production** URL for `main` behave as expected.

### GitHub repository secrets vs Vercel (runtime)

- **GitHub Actions secrets and variables** (Settings → Secrets and variables → Actions) are available only to **workflow runs** in this repo. They are **not** automatically available to the **Vercel** production app.
- The live Next.js app (OAuth, Resend, `DATABASE_URL`, `AUTH_SECRET`, etc.) reads **Vercel** → Project → **Settings → Environment Variables** (Production and Preview as needed). Copy from `.env.example` there; do not rely on GitHub repo secrets for Vercel runtime unless you add a custom deploy workflow that injects them (this repo’s `ci.yml` does not).
- **Exception:** Workflows that need tokens (e.g. `release.yml` using `GITHUB_TOKEN`) use GitHub’s built-in token or repo secrets only inside that job.

---

## SemVer Rules


| Bump              | When                       | Example       |
| ----------------- | -------------------------- | ------------- |
| **Major** (X.0.0) | Breaking changes           | 1.0.0 → 2.0.0 |
| **Minor** (0.X.0) | New features, non-breaking | 1.0.0 → 1.1.0 |
| **Patch** (0.0.X) | Bug fixes, small updates   | 1.0.0 → 1.0.1 |


---

## Next Steps: Getting to Production

Follow these steps in order once the codebase is committed and CI is green on `dev`.

### 1. Vercel — Connect and Configure

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** the `regexlens` GitHub repository.
2. Framework preset will auto-detect **Next.js** — accept defaults.
3. **Settings → Git:** set **Production Branch** to `main`.
4. **Settings → Environment Variables:** copy every key from `.env.example` into Vercel. Set values for **Production** and **Preview** scopes separately (preview can use test/dev credentials).
5. Push `dev` and confirm a **Preview deployment** builds successfully. Create a PR `dev → main`, merge, and confirm the **Production deployment** is live.

### 2. Neon — Free-Tier Database

1. Sign up at [neon.tech](https://neon.tech) and create a new project (region: closest to your users).
2. **Option A (recommended):** Install the **Neon** integration from the [Vercel Marketplace](https://vercel.com/integrations/neon) — this auto-sets `DATABASE_URL` in Vercel env vars.
3. **Option B:** Copy the connection string manually from the Neon dashboard and paste it into Vercel env vars for both Production and Preview.
4. Run the schema against the remote database:
  ```bash
   psql "$DATABASE_URL" -f docker/init.sql
  ```
5. (Optional) Create a separate Neon **branch** for Preview deployments so preview data is isolated from production.

### 3. GitHub — Branch Protection

1. Go to **Settings → Branches → Add rule** for `main`:
  - Require pull request before merging
  - Require status checks: `lint`, `typecheck`, `test`, `build`, `e2e`
  - Require branches to be up to date before merging
2. (Recommended) Add a similar rule for `dev` with the same checks.
3. Enable **Settings → Code security and analysis → Secret scanning** and **Push protection**.

### 4. Authentication — OAuth Providers

1. **Canonical URL (avoids `redirect_uri_mismatch`):** In Vercel → **Settings → Environment Variables** (Production), set **`NEXTAUTH_URL`** and/or **`AUTH_URL`** to a single origin you want users to use, e.g. `https://regexlens.dev`. Auth.js uses this (with `trustHost`) so OAuth `redirect_uri` is stable. In Vercel → **Settings → Domains**, set one hostname as primary and redirect the other (e.g. `www` → apex) so users do not bounce between two hosts.
2. **GitHub OAuth:** Create an OAuth App at [github.com/settings/developers](https://github.com/settings/developers).
  - **Authorization callback URL** (production): `https://regexlens.dev/api/auth/callback/github` — if you serve traffic on `www`, also add `https://www.regexlens.dev/api/auth/callback/github`.
  - Set `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` in **Vercel** (Production), not only in GitHub repo secrets.
  - For Preview, use a separate OAuth app with a callback URL matching the preview domain.
3. **Google OAuth (optional):** Create credentials at [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) (type: **Web application**).
  - **Authorized redirect URIs:** add **both** if both hostnames are attached in Vercel: `https://regexlens.dev/api/auth/callback/google` and `https://www.regexlens.dev/api/auth/callback/google` (Google requires an exact match; a common error is only listing the apex while the app sends `www`).
  - **Authorized JavaScript origins:** `https://regexlens.dev` and `https://www.regexlens.dev` (and `http://localhost:3000` for local dev).
  - Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in **Vercel** (Production).
4. **Resend (email magic link):** Set `AUTH_RESEND_KEY` (or `RESEND_API_KEY` — the app accepts either) and `EMAIL_FROM` to a sender on a domain you verified in Resend, e.g. `RegexLens <noreply@regexlens.dev>`. See `.env.example`.
5. **AUTH_SECRET:** Generate with `openssl rand -base64 32` and set in Vercel for both scopes.

### 5. Redis — Rate Limiting (optional)

1. In the Vercel dashboard, go to **Storage → Create Database → Redis** (via Upstash or your preferred provider).
2. Set `REDIS_URL` in your Vercel environment variables. Rate limiting activates automatically when this is present.

### 6. DNS / Custom Domain

1. In Vercel **Settings → Domains**, add `regexlens.dev`.
2. Update your domain registrar's DNS records to point to Vercel (typically an A record and/or CNAME as shown in the Vercel dashboard).
3. Vercel provisions SSL automatically.
4. Update `NEXT_PUBLIC_SITE_URL=https://regexlens.dev` and `NEXT_PUBLIC_DOCS_URL=https://docs.regexlens.dev` in Vercel env vars (Production scope).

### 6b. Documentation — GitHub Pages (`docs.regexlens.dev`)

The Nextra site in `docs/` deploys separately to **GitHub Pages** on a subdomain. The main app uses `NEXT_PUBLIC_DOCS_URL` (default `https://docs.regexlens.dev`) for all “Docs” links and **301-redirects** `/docs` and `/docs/*` to that host.

#### A. GitHub repository

1. Ensure **Pages** is enabled: **Settings → Pages → Build and deployment → Source: GitHub Actions** (workflow: `.github/workflows/docs-pages.yml`).
2. After the first successful deploy, open **Settings → Pages** and set **Custom domain** to: `docs.regexlens.dev`
3. Check **Enforce HTTPS** once DNS and the certificate are ready (GitHub provisions a Let’s Encrypt cert).

GitHub may show the exact DNS targets under **Custom domain** (verify and troubleshoot). For a project Pages site, you typically create a **CNAME** DNS record pointing the subdomain at GitHub’s edge (often `<user>.github.io` — confirm in the GitHub UI for your account).

#### B. Namecheap DNS

1. Namecheap → **Domain List** → **Manage** `regexlens.dev` → **Advanced DNS**.
2. Add a **CNAME Record**:
  - **Host:** `docs`
  - **Value:** use the hostname GitHub shows (commonly `nanaagyei.github.io` for user/project Pages — **copy from GitHub’s Custom domain** panel after saving `docs.regexlens.dev`, or from [GitHub Pages custom domain docs](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)).
  - **TTL:** Automatic or 30 min.
3. Remove conflicting records for the same host (e.g. another `docs` CNAME or redirect).
4. Wait for propagation (often minutes to a few hours). In GitHub Pages settings, wait until the check shows **DNS valid**.

The repo includes `docs/public/CNAME` with `docs.regexlens.dev` so static export publishes the domain hint for Pages.

**GitHub Pages URL vs styling (`user.github.io/repo`).** Project sites are served under a path prefix (`/regexlens`), but static export without `basePath` emits asset links like `/_next/...`, which load from the site root and 404 — you see HTML with no CSS. The workflow `.github/workflows/docs-pages.yml` sets `GH_PAGES_BASEPATH=/<repository>` (see `docs/next.config.mjs`) so `https://<user>.github.io/<repo>/` loads styles and scripts correctly.

**Custom domain at the root (`https://docs.regexlens.dev/`).** GitHub serves that hostname from the same artifact without the `/repo` prefix in URLs. A non-empty `basePath` can make asset URLs wrong on the custom domain. If you **only** use the custom domain as the canonical docs URL, create a repository **Actions** variable `DOCS_USE_ROOT_ASSET_PATHS` = `true` (Settings → Secrets and variables → Actions → Variables) so the workflow clears `GH_PAGES_BASEPATH`. Do not use that if you need the default `github.io/<repo>` URL to be styled.

#### C. Application environment (Vercel)

1. Set **`NEXT_PUBLIC_DOCS_URL=https://docs.regexlens.dev`** for **Production** (and Preview if you use a preview docs URL).
2. Redeploy the main app so links and redirects use the new value.

### 7. Final Verification

- `dev` branch Preview URL loads and works end-to-end
- PR `dev → main` passes all CI checks (lint, typecheck, test, build, e2e)
- Production URL loads after merge to `main`
- `https://docs.regexlens.dev` loads (GitHub Pages) and **HTTPS** is enforced
- `https://regexlens.dev/docs` redirects to the docs subdomain
- Auth sign-in flow works (GitHub and/or Google)
- Database tables exist and queries succeed
- Vercel Web Analytics and Speed Insights show data

