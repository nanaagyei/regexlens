import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: (
    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
      RegexLens Docs
    </span>
  ),
  project: {
    link: 'https://github.com/your-username/regexlens',
  },
  docsRepositoryBase: 'https://github.com/your-username/regexlens/tree/main/docs',
  footer: {
    text: (
      <span>
        {new Date().getFullYear()} © RegexLens. Built for developers who want to understand, not guess.
      </span>
    ),
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="RegexLens Documentation" />
      <meta property="og:description" content="Comprehensive documentation for RegexLens - understand, test, and visualize regex instantly" />
      <link rel="icon" href="/favicon.ico" />
    </>
  ),
  useNextSeoProps() {
    return {
      titleTemplate: '%s – RegexLens Docs'
    }
  },
  primaryHue: 38, // Amber/orange to match the app branding
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  editLink: {
    text: 'Edit this page on GitHub',
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback',
  },
  navigation: {
    prev: true,
    next: true,
  },
  banner: {
    key: 'pro-launch',
    text: (
      <a href="https://regexlens.app" target="_blank" rel="noreferrer">
        🎉 RegexLens Pro is now available! Try it free →
      </a>
    ),
  },
}

export default config
