import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [react(), dts({ include: ["src"], tsconfigPath: "./tsconfig.json" })],
  build: {
    lib: {
      entry: "src/index.tsx",
      formats: ["es"],
      fileName: "index",
    },
    rolldownOptions: {
      external: [
        "@atlaskit/pragmatic-drag-and-drop/combine",
        "@atlaskit/pragmatic-drag-and-drop/element/adapter",
        "@ptl/flex-layout",
        "react",
        "react-dom",
        "react-resizable-panels",
      ],
    },
  },
});
