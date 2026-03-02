<p align="center">
  <img src="public/regexlens-logo.png" width="100" height="100" alt="RegexLens Logo" />
</p>

<p align="center">
  <strong>Understand, test, and visualize regex instantly</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage">Usage</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a> •
  <a href="DEPLOYMENT.md">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/Monaco-Editor-purple?style=flat-square" alt="Monaco Editor" />
  <img src="https://img.shields.io/badge/regexp--tree-Parser-orange?style=flat-square" alt="regexp-tree" />
</p>

---

## Overview

**RegexLens** is a premium, UI-first developer tool for understanding, testing, and documenting regular expressions. Unlike traditional regex testers that only tell you *if* something matches, RegexLens shows you:

- **What it matches** — Live highlighting with color-coded capture groups
- **Why it matches** — Plain-English, step-by-step explanations
- **How it's structured** — Interactive syntax tree visualization
- **Where it might fail** — Performance warnings and correctness gotchas

No AI fluff. No chat interfaces. Just clarity.

---

## Features

### 🔍 Live Regex Testing

Real-time match highlighting as you type. See exactly where your pattern matches, with each capture group displayed in a distinct color. Supports all JavaScript regex flags (`g`, `i`, `m`, `s`, `u`, `y`).

- **Instant feedback** — Results update as you type (150ms debounce)
- **Group highlighting** — Each capture group gets its own color
- **Named groups** — Full support for `(?<name>...)` syntax
- **Match list** — See all matches with positions and group details

### 📖 Plain-English Explanations

Every regex is broken down into human-readable steps. No more deciphering cryptic patterns.

```
Pattern: ^([A-Z]+)\d{2,4}$

Explanation:
1. Start of input
2. Capture group #1
   └─ One or more uppercase letters (A-Z)
3. Between 2 and 4 digits
4. End of input
```

- **Deterministic** — Not AI-generated, just intelligent parsing
- **Hover sync** — Hover a step to highlight the corresponding regex segment
- **Click to lock** — Pin an explanation step to keep it highlighted

### 🌳 Structure View (AST)

Visualize the internal syntax tree of your regex. Understand exactly how the regex engine interprets your pattern.

- **Collapsible nodes** — Expand/collapse complex patterns
- **Type indicators** — See node types (Group, Quantifier, CharClass, etc.)
- **Range mapping** — Click nodes to highlight their source

### ⚠️ Smart Warnings

RegexLens detects common regex pitfalls before they bite you in production.

| Warning | Severity | Example |
|---------|----------|---------|
| Nested quantifiers | 🔴 Danger | `(a+)+` |
| Ambiguous `.*` | 🟡 Warn | `.*foo` |
| Alternation in repetition | 🟡 Warn | `(foo\|bar)*` |
| Unescaped dot | 🔵 Info | `example.com` |
| Pipe in character class | 🔵 Info | `[a\|b]` |
| Empty alternatives | 🟡 Warn | `(foo\|)` |
| Multiline anchor behavior | 🔵 Info | `^` with `m` flag |
| dotAll behavior | 🔵 Info | `.` with `s` flag |

Each warning includes:
- Clear explanation of the issue
- Why it matters
- How to fix it

### 🔗 Shareable Links

Share your regex with teammates. The entire state (pattern, flags, test text) is encoded in the URL.

```
https://regexlens.app/?p=XihbQS1aXSsp&f=gi&t=SGVsbG8gV29ybGQ=
```

No login required. No data stored.

### 📚 Built-in Templates

15 real-world regex patterns to learn from:

| Template | Description |
|----------|-------------|
| A/B + digits | Match sequences like `AB12`, `AAA99` |
| Email (basic) | Simple email validation |
| US Phone | Flexible phone number formats |
| ISO Date | YYYY-MM-DD validation |
| Quoted strings | Extract strings with escape handling |
| URL (HTTP/S) | Match web URLs |
| TODO comments | Find `// TODO:` in code |
| Multiple spaces | Detect extra whitespace |
| Markdown headings | Parse `#` headings |
| Word boundaries | Capture whole words |
| Password policy | Complexity requirements with lookaheads |
| Named groups | Phone number with named captures |
| Key=value pairs | Config file parsing |
| HTML tags | Simple tag matching (educational) |
| Danger demo | Catastrophic backtracking example |

---

## Demo

Try it live: **[regexlens.app](https://regexlens.app)** *(coming soon)*

Or run locally:

```bash
git clone https://github.com/your-username/regexlens.git
cd regexlens
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Getting Started

### Prerequisites

- **Node.js 18+** (recommended: 20+)
- **npm** or **pnpm** or **yarn**
- (Optional) PostgreSQL for Pro features

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/regexlens.git
cd regexlens

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file for optional features:

```env
# Database (only for Pro features)
DATABASE_URL=postgresql://user:password@localhost:5432/regexlens

# Auth.js (only for Pro features)
AUTH_SECRET=generate-with-openssl-rand-base64-32
AUTH_GITHUB_ID=your-github-oauth-client-id
AUTH_GITHUB_SECRET=your-github-oauth-client-secret

# Stripe (future Pro billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

> **Note:** The core regex features work without any environment variables. Auth and database are only needed for future Pro features.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |
| `npm run ci` | Run lint, typecheck, and build |

---

## Usage

### Basic Workflow

1. **Enter a regex pattern** in the left panel
2. **Toggle flags** as needed (g, i, m, s, u, y)
3. **Paste test text** in the center panel
4. **View results** in the right panel:
   - **Explanation tab** — Step-by-step breakdown
   - **Structure tab** — AST tree view
   - **Warnings tab** — Potential issues

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus regex editor |
| `Cmd/Ctrl + Enter` | Force re-parse |
| `Escape` | Clear selection |
| `Cmd/Ctrl + Shift + C` | Copy share link |

### Token Toolbar

Quick-insert common regex tokens:

`\d` `\w` `\s` `.` `+` `*` `?` `{}` `()` `(?:)` `[]` `^` `$` `|` `\b`

Click any token to append it to your pattern.

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.7 |
| UI Library | React 19 |
| Styling | Tailwind CSS 3.4 |
| Components | Shadcn/ui + Radix UI |
| Editor | Monaco Editor |
| Regex Parsing | regexp-tree |
| URL State | nuqs |
| Auth | Auth.js (NextAuth v5) |
| Database | PostgreSQL |


### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User Input     │────▶│  useRegexState   │────▶│  URL State      │
│  (pattern,text) │     │  (central state) │     │  (nuqs sync)    │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐
            │ Parse AST │ │  Matches  │ │ Warnings  │
            │(regexp-   │ │(JS RegExp)│ │(heuristics│
            │ tree)     │ │           │ │           │
            └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                  │             │             │
                  ▼             ▼             ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐
            │Explanation│ │ Highlight │ │ Warning   │
            │  Steps    │ │  Spans    │ │  Cards    │
            └───────────┘ └───────────┘ └───────────┘
```

---

## Safety & Limits

RegexLens includes safeguards to prevent UI lockups:

| Limit | Value | Purpose |
|-------|-------|---------|
| Max pattern length | 2,000 chars | Prevent parser slowdown |
| Max text length | 50,000 chars | Prevent match explosion |
| Max matches shown | 1,000 | Keep UI responsive |
| Parse debounce | 150ms | Reduce CPU usage |

Additionally, catastrophic backtracking patterns are detected and warned before they can cause problems.

---

## Pro Features (Coming Soon)

RegexLens Pro will add:

| Feature | Description |
|---------|-------------|
| **Saved Library** | Save and organize your regex patterns |
| **Export** | Markdown, PR comments, Notion-friendly |
| **Diff View** | Compare regex changes side-by-side |
| **Advanced Analysis** | Deeper backtracking detection |

Pricing: **$8/month** or **$49/year**

The core features will always remain free.

---

## API Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/me` | GET | No | Get current user & entitlement |
| `/api/auth/*` | * | No | NextAuth handlers |
| `/api/snippets` | GET, POST | Pro | List/create saved patterns |
| `/api/snippets/:id` | GET, PATCH, DELETE | Pro | Manage a pattern |
| `/api/export` | POST | Pro | Export explanation |
| `/api/analyze` | POST | Pro | Deep analysis |
| `/api/billing/checkout` | POST | Auth | Create Stripe session |
| `/api/billing/webhook` | POST | No | Stripe webhooks |

---

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/your-username/regexlens.git
cd regexlens

# Install dependencies
npm install

# Start dev server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Tailwind CSS for styling
- Shadcn/ui component patterns

---

## Acknowledgments

- [regexp-tree](https://github.com/nicolo-ribaudo/regexp-tree) — Regex parsing and AST
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — Code editor
- [Shadcn/ui](https://ui.shadcn.com/) — UI components
- [nuqs](https://github.com/47ng/nuqs) — URL state management
- [Lucide](https://lucide.dev/) — Icons

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built for developers who want to understand, not guess.</strong>
</p>

<p align="center">
  <a href="https://github.com/your-username/regexlens">GitHub</a> •
  <a href="https://regexlens.app">Live Demo</a> •
  <a href="https://twitter.com/regexlens">Twitter</a>
</p>
