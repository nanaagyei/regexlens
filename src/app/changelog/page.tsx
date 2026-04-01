import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { DOCS_URL } from "@/lib/site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://regexlens.dev";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Product updates and notable changes to RegexLens.",
  alternates: { canonical: `${siteUrl}/changelog` },
};

export default function ChangelogPage() {
  return (
    <LegalPageLayout title="Changelog">
      <p className="text-muted-foreground not-prose mb-6">
        Full documentation:{" "}
        <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
          {DOCS_URL}
        </a>
        . Newest entries first (UTC). History:{" "}
        <a href="https://github.com/nanaagyei" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>

      <h2>March 31, 2026</h2>
      <ul>
        <li>
          <strong>Documentation</strong> — Refreshed the <code>docs/</code> Nextra site to match the
          current product: Railroad diagram tab, Analysis tab (Pro), Regex Copilot (Pro), fixtures
          &amp; templates, sharing/URL format, keyboard shortcuts, and API shapes.
        </li>
        <li>
          <strong>Changelog</strong> — Added this page on the main site plus a mirrored{" "}
          <strong>Changelog</strong> entry in the docs navigation.
        </li>
        <li>
          <strong>Legal &amp; trust</strong> — Privacy Policy and Terms of Service pages, footer
          links, and Google OAuth–friendly legal URLs.
        </li>
        <li>
          <strong>Navigation</strong> — Homepage control from the editor; GitHub profile link in the
          landing footer.
        </li>
      </ul>

      <h2>Earlier releases</h2>
      <p>
        RegexLens ships as a single web app with a marketing landing page (<code>/</code>), the
        regex workbench (<code>/app</code>), pricing (<code>/pricing</code>), and optional Nextra
        documentation (see the <code>docs/</code> package). Core capabilities include live
        matching, plain-English explanations (deterministic), AST structure view, railroad diagrams,
        smart warnings, shareable URLs, templates &amp; fixture suites, Pro-only saved library with
        version history and diff, exports, advanced analysis API, and Pro Regex Copilot (streaming
        AI assistance).
      </p>
    </LegalPageLayout>
  );
}
