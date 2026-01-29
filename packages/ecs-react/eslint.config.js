import globals from "globals";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import reactConfig from "@ptl/eslint-config/react";

export default defineConfig([
  globalIgnores(["dist"]),
  reactRefresh.configs.vite,
  ...reactConfig.map((config) => ({ ...config, files: ["**/*.{ts,tsx}"] })),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
]);
