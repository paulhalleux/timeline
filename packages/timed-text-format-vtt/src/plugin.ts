import { createPlugin } from "@ptl/platform-core";
import { timedTextFormats } from "@ptl/timed-text-core";
import { vttAdapter } from "./adapter";

export const createVttTimedTextFormatPlugin = () => createPlugin({
  id: "timed-text.format.vtt",
  requires: [timedTextFormats],
  contributions: [timedTextFormats.contribute(vttAdapter)],
});
