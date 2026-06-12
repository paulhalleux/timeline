import { useMemo } from "react";
import type { TimedTextActionContext } from "@ptl/timed-text-core";
import { createTimedTextActionRegistry } from "@ptl/timed-text-core";
import { Actions, useActionContextMenu } from "@ptl/action-react";

export function TimedTextEditorActionsExample(props: {
  getContext: () => TimedTextActionContext;
}) {
  const actions = useMemo(
    () => createTimedTextActionRegistry({ getContext: props.getContext }),
    [props.getContext],
  );

  return (
    <Actions.Provider runner={actions.scope}>
      <Actions.Hotkeys />
      <CueListSurface />
    </Actions.Provider>
  );
}

function CueListSurface() {
  const contextMenu = useActionContextMenu();

  return (
    <Actions.Surface
      id="cue-list"
      tabIndex={0}
      onContextMenu={contextMenu.onContextMenu}
    >
      {contextMenu.menu.open ? (
        <div
          role="menu"
          style={{
            position: "fixed",
            left: contextMenu.menu.x,
            top: contextMenu.menu.y,
          }}
        >
          {contextMenu.items.map((item) => (
            <button
              key={item.action.id}
              role="menuitem"
              disabled={!item.state.enabled}
              onClick={() => void contextMenu.run(item.action)}
            >
              {item.action.title}
            </button>
          ))}
        </div>
      ) : null}
    </Actions.Surface>
  );
}
