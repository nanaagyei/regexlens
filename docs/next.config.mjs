import nextra from "nextra";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
  defaultShowCopyCode: true,
  staticImage: true,
});

const isGitHubPages = process.env.GITHUB_PAGES === "1";
const ghBasePath = (process.env.GH_PAGES_BASEPATH || "").replace(/\/$/, "");

export default withNextra({
  reactStrictMode: true,
  ...(isGitHubPages
    ? {
        output: "export",
        images: { unoptimized: true },
        ...(ghBasePath
          ? { basePath: ghBasePath, assetPrefix: `${ghBasePath}/` }
          : {}),
      }
    : {}),
});
