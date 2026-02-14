import { type Module, type ModuleWithFor } from "@ptl/modular-core";

import { type SubtitleEditorApi } from "./editor";

/**
 * Interface representing a module that can be attached to the SubtitleEditor.
 */
export type EditorModule<Api extends object = object> = Module<
  Api,
  SubtitleEditorApi
>;

/**
 * Type for an EditorModule class with the static `for` helper method.
 */
export type EditorModuleClass<T extends EditorModule> = ModuleWithFor<
  T,
  SubtitleEditorApi
>;
