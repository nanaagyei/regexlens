<p align="center">
  <img src="public/regexlens-logo.png" width="100" height="100" alt="RegexLens Logo" />
</p>

<h1 align="center">RegexLens</h1>

<p align="center">
  <strong>Understand, test, and visualize regular expressions — instantly.</strong>
</p>

<p align="center">
  <a href="https://regexlens.dev">Live App</a> &middot;
  <a href="https://docs.regexlens.dev">Docs</a> &middot;
  <a href="#getting-started">Getting Started</a> &middot;
  <a href="CONTRIBUTING.md">Contributing</a> &middot;
  <a href="https://buymeacoffee.com/nanaagyei">Support</a>
</p>

<p align="center">
  <a href="https://github.com/nanaagyei/regexlens/actions"><img src="https://img.shields.io/github/actions/workflow/status/nanaagyei/regexlens/ci.yml?branch=main&style=flat-square&label=CI" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/nanaagyei/regexlens?style=flat-square" alt="License" /></a>
  <a href="https://github.com/nanaagyei/regexlens/issues"><img src="https://img.shields.io/github/issues/nanaagyei/regexlens?style=flat-square" alt="Issues" /></a>
  <a href="https://buymeacoffee.com/nanaagyei"><img src="https://img.shields.io/badge/Support-Buy%20Me%20a%20Coffee-FFDD00?style=flat-square&logo=buy-me-a-coffee&logoColor=black" alt="Support" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
</p>

---

## What is RegexLens?

RegexLens is a free, open-source developer tool for understanding regular expressions. Unlike traditional regex testers that only tell you *if* something matches, RegexLens shows you:

- **What it matches** — Live highlighting with color-coded capture groups
- **Why it matches** — Plain-English, step-by-step explanations
- **How it's structured** — Interactive AST tree visualization
- **Where it might fail** — Performance warnings and correctness gotchas

All features are **free** for signed-in users. No paywalls, no premium tiers.

---

## Features

### Live Regex Testing

Real-time match highlighting as you type. Each capture group gets a distinct color. Supports all JavaScript regex flags (`g`, `i`, `m`, `s`, `u`, `y`).

### Plain-English Explanations

Every regex is broken down into human-readable steps — deterministic, not AI-generated.

```
Pattern: ^([A-Z]+)\d{2,4}$

1. Start of input
2. Capture group #1
   └─ One or more uppercase letters (A-Z)
3. Between 2 and 4 digits
4. End of input
```

### Structure View (AST)

Visualize the internal syntax tree. Collapsible nodes, type indicators, and click-to-highlight source mapping.

### Smart Warnings

Detects common pitfalls — nested quantifiers, ambiguous `.*`, unescaped dots, empty alternatives, and more — with explanations and fixes.

### Regex Copilot

AI-powered assistant for regex help, powered by streaming chat. Ask questions, get suggestions, iterate on patterns.

### Additional Features

- **Shareable links** — Pattern, flags, and test text encoded in the URL
- **Saved library** — Save, organize, and version-track your patterns
- **Export** — Markdown, PR comments, Notion-friendly formats
- **Diff view** — Compare regex versions side-by-side
- **Advanced analysis** — Deeper backtracking and complexity detection
- **15 built-in templates** — Real-world patterns to learn from
- **Fixture suites** — Test patterns against expected match sets

---

## Getting Started

### Prerequisites

- **Node.js 18+** (recommended: 20+)
- **npm**, **pnpm**, or **yarn**
- **Docker** (for local PostgreSQL database)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/nanaagyei/regexlens.git
cd regexlens

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start the database
docker compose up -d

# Generate an AUTH_SECRET and add it to .env.local
openssl rand -base64 32

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Core regex features (testing, explanations, AST, warnings, sharing) work without any environment variables. The database and auth setup are needed for saved library, export, AI chat, and analysis features.

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (for DB features) | PostgreSQL connection string |
| `AUTH_SECRET` | Yes (for auth) | Random secret — `openssl rand -base64 32` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | Yes (for auth) | [GitHub OAuth app](https://github.com/settings/developers) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional | Google OAuth credentials |
| `AUTH_RESEND_KEY` | Optional | [Resend](https://resend.com) API key for magic links |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Optional | Vercel KV for rate limiting |

See [`.env.example`](.env.example) for the full list with inline documentation.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint (zero warnings enforced) |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |
| `npm run ci` | Run lint + typecheck + test + build |
| `npm run db:start` | Start PostgreSQL via Docker Compose |
| `npm run db:stop` | Stop PostgreSQL |
| `npm run db:reset` | Reset database (destroys data) |

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.7 (strict) |
| UI | React 19 |
| Styling | Tailwind CSS 3.4 |
| Components | shadcn/ui + Radix UI |
| Editor | Monaco Editor |
| Regex Parsing | regexp-tree |
| URL State | nuqs |
| Auth | Auth.js (NextAuth v5) |
| Database | PostgreSQL |
| Testing | Vitest + Playwright |

### Data Flow

```
User Input (pattern, text, flags)
       │
       ▼
  useRegexState (central state + URL sync via nuqs)
       │
       ├──▶ Parse AST (regexp-tree)  ──▶ Explanation Steps
       ├──▶ Compute Matches (RegExp) ──▶ Highlight Spans
       └──▶ Run Heuristics           ──▶ Warning Cards
```

### API Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/me` | GET | No | Current user info |
| `/api/auth/*` | * | No | Auth.js handlers |
| `/api/snippets` | GET, POST | Yes | List/create saved patterns |
| `/api/snippets/:id` | GET, PATCH, DELETE | Yes | Manage a pattern |
| `/api/snippets/:id/versions` | GET, POST | Yes | Version history |
| `/api/snippets/:id/diff` | POST | Yes | Compare versions |
| `/api/export` | POST | Yes | Export explanation |
| `/api/analyze` | POST | Yes | Deep regex analysis |
| `/api/ai/chat` | POST | Yes | AI Copilot chat |

---

## Safety Limits

| Limit | Value | Purpose |
|-------|-------|---------|
| Max pattern length | 2,000 chars | Prevent parser slowdown |
| Max text length | 50,000 chars | Prevent match explosion |
| Max matches shown | 1,000 | Keep UI responsive |
| Parse debounce | 150ms | Reduce CPU usage |

Catastrophic backtracking patterns are detected and warned before they cause problems.

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Setting up your development environment
- Code style and conventions
- Submitting pull requests
- Reporting bugs

## Community

- [GitHub Issues](https://github.com/nanaagyei/regexlens/issues) — Bug reports and feature requests
- [GitHub Discussions](https://github.com/nanaagyei/regexlens/discussions) — Questions and ideas

## Support the Project

RegexLens is free and open source. If you find it useful, consider supporting development:

<a href="https://buymeacoffee.com/nanaagyei"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee" /></a>

---

## Security

Found a vulnerability? Please see [SECURITY.md](SECURITY.md) for responsible disclosure guidelines. Do **not** open a public issue for security reports.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [regexp-tree](https://github.com/DmitrySoshnikov/regexp-tree) — Regex parsing and AST
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — Code editor
- [shadcn/ui](https://ui.shadcn.com/) — UI components
- [nuqs](https://nuqs.47ng.com/) — URL state management
- [Lucide](https://lucide.dev/) — Icons
- [Auth.js](https://authjs.dev/) — Authentication

---

<p align="center">
  Built for developers who want to <strong>understand</strong>, not guess.
</p>
