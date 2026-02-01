import libraryConfig from "@ptl/eslint-config/library";
import {defineConfig, globalIgnores} from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  libraryConfig.map((a) => a),
]);
