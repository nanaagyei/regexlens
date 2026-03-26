# RegexLens Deployment & CI/CD

This document covers cloud database setup (Neon Postgres), branch strategy, CI/CD workflows, and release automation.

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| **dev** | Default branch for feature work. All CI checks run on every push and on PRs. |
| **main** | Protected. Only merge from dev after checks pass. Production deploys only from main. |

**Flow:** `dev` → Pull Request (checks pass) → `main` → Vercel Production

**Releases:** Tag `main` after merge when cutting a release (e.g. `v1.0.0`).

---

## GitHub Branch Protection (main)

Configure in **Settings → Branches → Add branch protection rules** for **`main`** and (recommended) **`dev`**:

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
4. **Environment variables** — `DATABASE_URL` is auto-set by the Vercel integration; add `AUTH_*`, `STRIPE_*` as needed

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
- **Preview deployments:** All Git branches, or treat **`dev`** as the primary staging branch (merge previews before promoting to `main`)
- **Environment variables:** `DATABASE_URL` (from Neon), `AUTH_*`, `STRIPE_*`, `KV_*`, `NEXT_PUBLIC_SITE_URL`, observability flags (`NEXT_PUBLIC_VERCEL_ANALYTICS`, optional ad flags), etc.

### Vercel + GitHub checklist (manual)

1. **Connect the GitHub repo** to a Vercel project and import this Next.js app root.
2. **Set Production branch** to `main` (Project → Settings → Git).
3. **Attach Neon** via Vercel Marketplace or paste `DATABASE_URL` for Preview and Production (use separate Neon branches if you want isolated preview data).
4. **Copy env vars** from `.env.example` into Vercel (Production + Preview); never commit real secrets.
5. **Protect `main`** in GitHub as above so only green CI can merge.
6. After connect, confirm **Preview** URL for `dev` and **Production** URL for `main` behave as expected.

---

## SemVer Rules

| Bump | When | Example |
|------|------|---------|
| **Major** (X.0.0) | Breaking changes | 1.0.0 → 2.0.0 |
| **Minor** (0.X.0) | New features, non-breaking | 1.0.0 → 1.1.0 |
| **Patch** (0.0.X) | Bug fixes, small updates | 1.0.0 → 1.0.1 |
