import React from "react";
import type { DocsThemeConfig } from "nextra-theme-docs";

function withBasePath(path: string): string {
  const base = (process.env.GH_PAGES_BASEPATH || "").replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

function faviconHref(): string {
  return withBasePath("/favicon.ico");
}

function logoSrc(): string {
  return withBasePath("/regexlens-logo.png");
}

const site = "https://regexlens.dev";

const config: DocsThemeConfig = {
  logo: (
    <span style={{ display: "flex", alignItems: "center" }}>
      <img
        src={logoSrc()}
        width={100}
        height={100}
        alt="RegexLens"
        decoding="async"
        style={{ display: "block", borderRadius: 8 }}
      />
    </span>
  ),
  project: {
    link: "https://github.com/nanaagyei/regexlens",
  },
  docsRepositoryBase: "https://github.com/nanaagyei/regexlens/tree/main/docs",
  footer: {
    text: (
      <span
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span>{new Date().getFullYear()} © RegexLens</span>
        <span aria-hidden="true">·</span>
        <a href="https://regexlens.dev" target="_blank" rel="noreferrer">
          App
        </a>
        <span aria-hidden="true">·</span>
        <a href="https://www.buymeacoffee.com/nanaagyei" target="_blank" rel="noreferrer">
          Support
        </a>
      </span>
    ),
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="RegexLens Documentation" />
      <meta
        property="og:description"
        content="Documentation for RegexLens — test, explain, and visualize JavaScript regular expressions."
      />
      <link rel="icon" href={faviconHref()} />
    </>
  ),
  useNextSeoProps() {
    return {
      titleTemplate: "%s – RegexLens Docs",
    };
  },
  primaryHue: 38,
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  editLink: {
    text: "Edit this page on GitHub",
  },
  feedback: {
    content: "Question? Open an issue on GitHub →",
    labels: "feedback",
  },
  navigation: {
    prev: true,
    next: true,
  },
  banner: {
    key: "regexlens-docs-2026",
    text: (
      <a href={site} target="_blank" rel="noreferrer">
        Open the RegexLens app →
      </a>
    ),
  },
};

export default config;
