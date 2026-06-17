import { createPlugin } from "@ptl/platform-core";
import { timedTextFormats } from "@ptl/timed-text-core";
import { srtAdapter } from "./adapter";

export const createSrtTimedTextFormatPlugin = () => createPlugin({
  id: "timed-text.format.srt",
  requires: [timedTextFormats],
  contributions: [timedTextFormats.contribute(srtAdapter)],
});
