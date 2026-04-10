# RegexLens Setup Guide

This guide walks you through setting up RegexLens for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** (recommended: 20+)
- **Docker Desktop** (for the PostgreSQL database)
- **Git**

## Quick Start

Get up and running in under 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/nanaagyei/regexlens.git
cd regexlens

# If you're contributing from a fork, clone your fork URL instead.

# 2. Install dependencies
npm install

# This installs Git hooks (Husky) via the `prepare` script so pre-commit runs lint-staged.

# 3. Start the database
npm run db:start

# 4. Copy environment template
cp .env.example .env.local

# 5. Generate AUTH_SECRET
# On macOS/Linux:
openssl rand -base64 32
# Copy the output to AUTH_SECRET in .env.local

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Database Setup

RegexLens uses PostgreSQL for storing user data and saved regex patterns.

### Starting the Database

```bash
# Start PostgreSQL container
npm run db:start

# Or using docker compose directly
docker compose up -d
```

### Connection Details

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5433` |
| Database | `regexlens` |
| Username | `regexlens` |
| Password | `regexlens_dev` |
| Connection String | `postgresql://regexlens:regexlens_dev@localhost:5433/regexlens` |

### Database Commands

```bash
# Start database
npm run db:start

# Stop database
npm run db:stop

# Reset database (deletes all data)
npm run db:reset

# View database logs
npm run db:logs
```

### Connecting with psql

```bash
# Connect to the database
docker exec -it regexlens-db psql -U regexlens -d regexlens

# Example queries
\dt                    # List all tables
SELECT * FROM users;   # View users
\q                     # Quit
```

### Using pgAdmin (Optional)

If you prefer a GUI, you can connect pgAdmin to the database using the connection details above.

---

## Authentication Setup

RegexLens supports three authentication methods:
- GitHub OAuth
- Google OAuth
- Email Magic Links (via Resend)

### GitHub OAuth (Recommended)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in the details:
   - **Application name:** `RegexLens Local`
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID** to `AUTH_GITHUB_ID` in `.env.local`
6. Generate a new **Client Secret** and copy it to `AUTH_GITHUB_SECRET`

### Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the **Client ID** to `AUTH_GOOGLE_ID` in `.env.local`
8. Copy the **Client Secret** to `AUTH_GOOGLE_SECRET`

### Email Magic Links (Optional)

Email authentication uses [Resend](https://resend.com) for sending magic link emails.

1. Sign up at [resend.com](https://resend.com)
2. Create an API key in the dashboard
3. Copy the API key to `AUTH_RESEND_KEY` in `.env.local`
4. Set `EMAIL_FROM` to your verified sender address (or use `onboarding@resend.dev` for testing)

**Note:** For local testing, Resend provides a test mode that doesn't require domain verification.

---

## Rate Limiting (Redis)

Rate limiting uses Redis to prevent abuse.

### Local Development

**Rate limiting is automatically disabled** when `REDIS_URL` is not set. This is fine for local development.

### Production Setup

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** > **Create Database** > **Redis** (via Upstash or your preferred provider)
4. Copy the connection URL to your environment variables:
   - `REDIS_URL`

---

## Environment Variables Reference

Create a `.env.local` file with the following variables:

```env
# ===========================================
# Database
# ===========================================
DATABASE_URL=postgresql://regexlens:regexlens_dev@localhost:5433/regexlens

# ===========================================
# Authentication (Auth.js)
# ===========================================
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-secret-here

# GitHub OAuth (required for login)
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Google OAuth (optional)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Email via Resend (optional)
AUTH_RESEND_KEY=
EMAIL_FROM=noreply@localhost

# ===========================================
# Rate Limiting - Redis (optional)
# ===========================================
REDIS_URL=
```

### Variable Descriptions

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Secret for signing auth tokens |
| `AUTH_GITHUB_ID` | Yes* | GitHub OAuth client ID |
| `AUTH_GITHUB_SECRET` | Yes* | GitHub OAuth client secret |
| `AUTH_GOOGLE_ID` | No | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth client secret |
| `AUTH_RESEND_KEY` | No | Resend API key for email auth |
| `EMAIL_FROM` | No | Sender email address |
| `REDIS_URL` | No | Redis connection URL for rate limiting |

*At least one OAuth provider is required for authentication.

---

## Troubleshooting

### Docker: `docker-credential-desktop: executable file not found`

When running `docker compose up` or `npm run db:start`, Docker may try to use the **Docker Desktop** credential helper (`docker-credential-desktop`). If that binary is not on your `PATH` (for example you use Colima, Rancher Desktop, OrbStack, or removed Docker Desktop but kept its config), pulls can fail.

**Fix one of these ways:**

1. **Use Docker Desktop** and ensure it is running so the credential helper is available, or  
2. **Edit `~/.docker/config.json`:** remove the `"credsStore": "desktop"` line (or set `"credsStore"` to a helper you have, e.g. `"osxkeychain"` on macOS), then retry the pull.  
3. Public image pulls often work without any credential helper once the invalid `credsStore` entry is cleared.

### Database connection failed

```bash
# Check if the container is running
docker ps

# View container logs
npm run db:logs

# Reset the database
npm run db:reset
```

### Port 5433 already in use

Another PostgreSQL instance may be running. Either stop it or change the port in `docker-compose.yml` to a different port (e.g., 5434), then update `DATABASE_URL` accordingly.

### Authentication not working

1. Verify your OAuth callback URLs match exactly
2. Check that `AUTH_SECRET` is set
3. Ensure the database is running and accessible

---

## Pre-commit checks

After `npm install`, [Husky](https://typicode.github.io/husky/) runs **lint-staged** on each commit: staged `*.{js,jsx,ts,tsx,mjs}` files are linted with ESLint. Fix reported issues before committing, or run `npm run lint` locally.

---

## Automated tests

- **Unit / integration (Vitest):** `npm run test` (with coverage: `npm run test:coverage`)
- **Browser (Playwright):** First time only, install browsers: `npx playwright install chromium`, then `npm run test:e2e`

---

## Next Steps

- Read the [README.md](README.md) for feature documentation
- Explore the [API routes](src/app/api) for backend functionality
- Check out the [components](src/components) for UI patterns

---

## Need Help?

- Open an issue on GitHub
- Check existing issues for solutions
- Review the codebase documentation
