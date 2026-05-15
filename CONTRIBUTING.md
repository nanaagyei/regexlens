# Contributing to RegexLens

Thank you for your interest in contributing to RegexLens! This guide will help you get started.

## Documentation

End-user and contributor-facing product documentation lives in the **Nextra** site under [`docs/pages/`](docs/pages/) and is published at **[docs.regexlens.dev](https://docs.regexlens.dev)**. When you change behavior or UX, update the relevant MDX there and run the docs app from the `docs/` directory to preview.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/nanaagyei/regexlens/issues) to avoid duplicates.
2. Open a [new issue](https://github.com/nanaagyei/regexlens/issues/new) with:
   - A clear, descriptive title
   - Steps to reproduce the problem
   - Expected vs. actual behavior
   - Browser and OS information
   - Screenshots if applicable

### Suggesting Features

Open an issue with the **feature request** label. Describe:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### Submitting Pull Requests

1. **Fork** the repository and create your branch from `main`.
2. **Install dependencies** and ensure your environment works:
   ```bash
   npm install
   cp .env.example .env.local
   npm run dev
   ```
3. **Make your changes** in a focused, incremental way.
4. **Write or update tests** for your changes.
5. **Run the full check suite** before submitting:
   ```bash
   npm run ci    # lint + typecheck + test + build
   ```
6. **Open a pull request** with:
   - A clear title and description
   - Reference to any related issues
   - Screenshots for UI changes

## Development Setup

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm
- Docker (for PostgreSQL)

### Local Development

```bash
git clone https://github.com/nanaagyei/regexlens.git
cd regexlens
npm install
cp .env.example .env.local
docker compose up -d     # Start PostgreSQL
npm run dev              # Start dev server at localhost:3000
```

### Running Tests

```bash
npm run test             # Unit tests (Vitest)
npm run test:watch       # Watch mode
npm run test:e2e         # E2E tests (Playwright)
npm run test:coverage    # Coverage report
```

## Code Style

- **TypeScript** strict mode — no `any` unless absolutely necessary
- **ESLint** with zero warnings enforced
- **Tailwind CSS** for styling — use shadcn/ui component patterns
- **Prettier** for formatting (runs via lint-staged on commit)

### Conventions

- Server Components by default; only add `'use client'` when needed
- Use Server Actions for mutations, Route Handlers for API endpoints
- Prefer named exports
- Keep components focused — one responsibility per file
- Write tests for new logic in `*.test.ts` files alongside the source

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add regex diff comparison view
fix: correct capture group highlighting for nested groups
docs: update API route documentation
test: add unit tests for match engine
refactor: simplify explanation panel state management
chore: update dependencies
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── auth.ts           # Auth.js configuration
├── components/       # React components
│   ├── ai/           # AI Copilot components
│   ├── analysis/     # Analysis panel
│   ├── explain/      # Explanation panel
│   ├── export/       # Export modal
│   ├── landing/      # Landing page
│   ├── layout/       # App shell, nav, user menu
│   ├── library/      # Saved patterns library
│   ├── testbench/    # Regex editor and match display
│   └── ui/           # shadcn/ui primitives
├── hooks/            # Custom React hooks
├── lib/              # Core logic (parsing, matching, warnings)
│   ├── auth/         # Auth utilities
│   ├── regex/        # Parse, match, normalize
│   ├── explain/      # Explanation generator
│   ├── warnings/     # Heuristic warning engine
│   ├── security/     # Rate limiting, validation
│   └── snippets/     # Snippet diff utilities
└── contexts/         # React contexts
```

## Questions?

Open a [discussion](https://github.com/nanaagyei/regexlens/discussions) or reach out via [issues](https://github.com/nanaagyei/regexlens/issues).

Thank you for helping make RegexLens better!
