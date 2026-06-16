import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  deps: {
    neverBundle: ["react", "react-dom"],
  },
  fromVite: true,
});
