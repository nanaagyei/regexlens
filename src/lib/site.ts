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
