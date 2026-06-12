import {
  createActionRegistry,
  createShortcutMap,
  enabledActionState,
  executeAction,
  type ActionDefinition,
  type ActionId,
  type ActionState,
  type ActionTriggerSource,
} from "@ptl/actions";
import { useCallback, useEffect, useMemo, useState } from "react";
import { mockEditorActions } from "./mock-actions";
import type { EditorActionServices, EditorActivityEntry } from "./services";
import { eventToShortcut } from "./shortcut";

export interface EditorActionRuntime {
  actions: ActionDefinition<EditorActionServices>[];
  activity: EditorActivityEntry[];
  commandPaletteOpen: boolean;
  execute(actionId: ActionId, source: ActionTriggerSource): Promise<void>;
  getActionState(action: ActionDefinition<EditorActionServices>): ActionState;
  inspectorOpen: boolean;
  setCommandPaletteOpen(open: boolean): void;
}

export function useEditorActions(): EditorActionRuntime {
  const [activity, setActivity] = useState<EditorActivityEntry[]>([]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  const addActivity = useCallback((message: string) => {
    setActivity((entries) => [{ id: Date.now(), message }, ...entries].slice(0, 6));
  }, []);

  const services = useMemo<EditorActionServices>(
    () => ({
      addActivity,
      getInspectorOpen: () => inspectorOpen,
      setInspectorOpen,
      setCommandPaletteOpen,
    }),
    [addActivity, inspectorOpen],
  );

  const registry = useMemo(() => createActionRegistry<EditorActionServices>(mockEditorActions), []);
  const actions = useMemo(() => registry.list(), [registry]);
  const shortcuts = useMemo(() => createShortcutMap(actions), [actions]);

  const execute = useCallback(
    async (actionId: ActionId, source: ActionTriggerSource) => {
      const result = await executeAction(registry, actionId, { source, services });

      if (!result.ok) addActivity(result.error.message);
    },
    [addActivity, registry, services],
  );

  const getActionState = useCallback(
    (action: ActionDefinition<EditorActionServices>) =>
      action.getState?.({ source: "programmatic", services }) ?? enabledActionState(),
    [services],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = eventToShortcut(event);
      if (!shortcut) return;

      const actionId = shortcuts.get(shortcut);
      if (!actionId) return;

      event.preventDefault();
      void execute(actionId, "shortcut");
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [execute, shortcuts]);

  return {
    actions,
    activity,
    commandPaletteOpen,
    execute,
    getActionState,
    inspectorOpen,
    setCommandPaletteOpen,
  };
}
