function shellQuote(path) {
  if (!/[\\\s'"]/.test(path)) return path;
  return `'${path.replace(/'/g, `'\\''`)}'`;
}

const lintStagedConfig = {
  "*.{js,jsx,ts,tsx,mjs}": (filenames) =>
    filenames.length > 0
      ? `eslint --max-warnings 0 ${filenames.map((f) => shellQuote(f)).join(" ")}`
      : "true",
};

export default lintStagedConfig;
