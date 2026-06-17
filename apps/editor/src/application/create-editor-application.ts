import { createPlatform } from "@ptl/platform-core";
import { defaultEditorLayout } from "../layouts/default-editor-layout";
import { createExportPlugin } from "../plugins/export/create-export-plugin";
import { createSrtExportPlugin } from "../plugins/export/create-srt-export-plugin";

export const createEditorPlugins = () => [createExportPlugin(), createSrtExportPlugin()] as const;

export const createEditorApplication = () => ({
  platform: createPlatform({ plugins: createEditorPlugins() }),
  initialLayout: defaultEditorLayout,
});
