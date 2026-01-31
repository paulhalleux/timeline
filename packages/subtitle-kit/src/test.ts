import fs from "fs";

import { SubtitleParser } from "./formats/SubtitleParser";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import sample from "./samples/srt/example.srt" with { type: "text" };
import { TimestampParser } from "./utils/timestamp";

const doc = SubtitleParser.parse("srt", sample);
doc.insert({
  index: 3,
  start: TimestampParser.fromText("00:00:10,000"),
  end: TimestampParser.fromText("00:00:12,000"),
  text: "Inserted subtitle",
});
const srtString = SubtitleParser.stringify("srt", doc);

fs.mkdirSync("out", { recursive: true });
fs.writeFileSync("out/parsed.json", JSON.stringify(doc, null, 2));
fs.writeFileSync("out/output.srt", srtString);
