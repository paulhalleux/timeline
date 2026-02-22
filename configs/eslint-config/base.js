import js from "@eslint/js";
import tseslint from "typescript-eslint";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier/flat";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.{js,ts,tsx,jsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
      prettier,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "inline-type-imports",
        },
      ],
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            // Side effect imports.
            ["^\\u0000"],
            // Node.js builtins prefixed with `node:`.
            ["^node:"],
            // React (and react-dom, react-*) — always first among packages.
            ["^react$", "^react-dom$", "^react/", "^react-dom/", "^react-.+"],
            // Workspace packages.
            ["^@ptl/"],
            // Other third-party packages.
            ["^@?\\w"],
            // Absolute imports / path aliases (anything not matched above).
            ["^"],
            // Relative imports.
            ["^\\."],
            // Style / asset imports (.css, .scss, .svg, images, etc.).
            [
              "^.+\\.(css|scss|sass|less|module\\.css|svg|png|jpg|jpeg|gif|webp|ico)$",
            ],
          ],
        },
      ],
      "simple-import-sort/exports": "warn",
      "prettier/prettier": "warn",
    },
  },
];
