function shellQuote(path) {
  if (!/[\\\s'"]/.test(path)) return path;
  return `'${path.replace(/'/g, `'\\''`)}'`;
}

const ignoredDirs = ["docs/", "e2e/", "node_modules/", ".next/", "out/", "build/", "coverage/"];

const lintStagedConfig = {
  "*.{js,jsx,ts,tsx,mjs}": (filenames) => {
    const filtered = filenames.filter(
      (f) => !ignoredDirs.some((dir) => f.includes(`/${dir}`))
    );
    return filtered.length > 0
      ? `eslint --max-warnings 0 ${filtered.map((f) => shellQuote(f)).join(" ")}`
      : "true";
  },
};

export default lintStagedConfig;
