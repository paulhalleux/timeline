import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";
import reactConfig from "@ptl/eslint-config/react";

export default defineConfig([
  globalIgnores(["dist"]),
  ...reactConfig.map((config) => ({ ...config, files: ["**/*.{ts,tsx}"] })),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
]);
