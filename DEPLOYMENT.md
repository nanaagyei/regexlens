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

Configure in **Settings → Branches → Add branch protection rule** for `main`:

- **Require a pull request before merging**
- **Require status checks to pass:** `lint`, `typecheck`, `build` (from `ci.yml`)
- **Require branches to be up to date** before merging
- **Restrict who can push** (or require PR from dev)

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

**Triggers:** Push to `dev`, pull requests targeting `dev` or `main`

**Jobs:** lint, typecheck, build, security (`npm audit --audit-level=high`)

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
- **Preview branches:** `dev` (optional)
- **Environment variables:** `DATABASE_URL` (from Neon), `AUTH_*`, `STRIPE_*`, etc.

---

## SemVer Rules

| Bump | When | Example |
|------|------|---------|
| **Major** (X.0.0) | Breaking changes | 1.0.0 → 2.0.0 |
| **Minor** (0.X.0) | New features, non-breaking | 1.0.0 → 1.1.0 |
| **Patch** (0.0.X) | Bug fixes, small updates | 1.0.0 → 1.0.1 |
