import { createPlugin } from "@ptl/platform-core";
import {
  createTimedTextFormatContribution,
  timedTextFormatContributions,
} from "@ptl/timed-text-core";
import { vttAdapter } from "./adapter";

export const createVttTimedTextFormatPlugin = () =>
  createPlugin({
    id: "timed-text.format.vtt",
    requires: [timedTextFormatContributions],
    contributions: [
      timedTextFormatContributions.contribute(
        createTimedTextFormatContribution({ adapter: vttAdapter }),
      ),
    ],
  });
