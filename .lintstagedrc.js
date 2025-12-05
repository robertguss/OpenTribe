import path from "path";

/**
 * Lint-Staged Configuration
 *
 * Runs on staged files before commit:
 * 1. ESLint - Check and fix linting errors on JS/TS files
 * 2. TypeScript - Type check the entire project when TS files change
 * 3. Prettier - Format all supported files
 */

const buildEslintCommand = (filenames) =>
  `eslint --fix ${filenames
    .map((f) => `"${path.relative(process.cwd(), f)}"`)
    .join(" ")}`;

const config = {
  // ESLint for JavaScript/TypeScript files
  "*.{js,jsx,ts,tsx}": [buildEslintCommand],

  // TypeScript type checking - runs on the whole project when any TS file changes
  // Note: tsc doesn't support checking individual files, so we check the whole project
  "*.{ts,tsx}": () => "tsc --noEmit",

  // Prettier formatting for all supported files
  "*.{js,jsx,ts,tsx,json,css,md,mdx,yaml,yml}": ["prettier --write"],
};

export default config;
