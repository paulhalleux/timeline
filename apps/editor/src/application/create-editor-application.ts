import { createApplication } from "@ptl/platform-core";
import { defaultEditorLayout } from "../layouts/default-editor-layout";
import {
  createDockHostPlugin,
  createInspectorPlugin,
  createOutlinePlugin,
  createPlaybackPlugin,
  createQualityControlPlugin,
  createShellPlugin,
  createSubtitleDocumentPlugin,
  createTimelinePlugin,
  createTracksPlugin,
} from "../plugins/simple-feature-plugins";
import { createExportPlugin } from "../plugins/export/create-export-plugin";
import { createSrtTimedTextFormatPlugin } from "@ptl/timed-text-format-srt";
import { createVttTimedTextFormatPlugin } from "@ptl/timed-text-format-vtt";

export const createEditorPlugins = () =>
  [
    createDockHostPlugin(),
    createShellPlugin(),
    createSubtitleDocumentPlugin(),
    createOutlinePlugin(),
    createTracksPlugin(),
    createInspectorPlugin(),
    createQualityControlPlugin(),
    createPlaybackPlugin(),
    createTimelinePlugin(),
    createExportPlugin(),
    createSrtTimedTextFormatPlugin(),
    createVttTimedTextFormatPlugin(),
  ] as const;

export const createEditorApplication = () => ({
  platform: createApplication({ plugins: createEditorPlugins() }),
  layout: defaultEditorLayout,
});
