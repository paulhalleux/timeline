import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const externalPackages = [
  "@base-ui/react",
  "@fontsource-variable/inter",
  "class-variance-authority",
  "clsx",
  "cmdk",
  "lucide-react",
  "react",
  "react-dom",
  "react/jsx-runtime",
  "tailwind-merge",
  "tw-animate-css",
];

export default defineConfig({
  plugins: [react(), dts({ include: ["src"], tsconfigPath: "./tsconfig.json" })],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rolldownOptions: {
      external: (id) =>
        externalPackages.some(
          (packageName) => id === packageName || id.startsWith(`${packageName}/`),
        ),
    },
  },
});
