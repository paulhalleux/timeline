import { createPlugin } from "@ptl/platform-core";
import {
  createTimedTextFormatContribution,
  timedTextFormatContributions,
} from "@ptl/timed-text-core";
import { srtAdapter } from "./adapter";

export const createSrtTimedTextFormatPlugin = () =>
  createPlugin({
    id: "timed-text.format.srt",
    requires: [timedTextFormatContributions],
    contributions: [
      timedTextFormatContributions.contribute(
        createTimedTextFormatContribution({ adapter: srtAdapter }),
      ),
    ],
  });
