/** Public site URLs — strip trailing slashes for consistent comparisons and redirects. */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export const SITE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://regexlens.dev"
);

/** Nextra / GitHub Pages documentation (e.g. https://docs.regexlens.dev). */
export const DOCS_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.regexlens.dev"
);
export const GITHUB_REPO_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_GITHUB_REPO_URL ?? "https://github.com/nanaagyei/regexlens"
);

export const GITHUB_CONTRIBUTING_URL = `${GITHUB_REPO_URL}/blob/main/CONTRIBUTING.md`;

export const GITHUB_LICENSE_URL = `${GITHUB_REPO_URL}/blob/main/LICENSE`;

export const GITHUB_DISCUSSIONS_URL = `${GITHUB_REPO_URL}/discussions`;
/** Voluntary sponsorship (e.g. Buy Me a Coffee) — not a product tier or paywall. */
export const SUPPORT_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SUPPORT_URL ?? "https://buymeacoffee.com/nanaagyei"
);
