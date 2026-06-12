import { useMemo } from "react";
import type { TimedTextActionContext } from "@ptl/timed-text-core";
import { createTimedTextActionRegistry } from "@ptl/timed-text-core";
import {
  useActionContextMenu,
  useActionHotkeys,
  useActionScopeElement,
} from "@ptl/action-react";

export function TimedTextEditorActionsExample(props: {
  getContext: () => TimedTextActionContext;
}) {
  const actions = useMemo(
    () => createTimedTextActionRegistry({ getContext: props.getContext }),
    [props.getContext],
  );
  const { ref, scopeElementId } = useActionScopeElement(
    (element) => actions.registerElement(element),
    { id: "cue-list" },
  );
  const contextMenu = useActionContextMenu(actions.scope, { scopeElementId });

  useActionHotkeys(actions.scope, { scopeElementId });

  return (
    <section ref={ref} tabIndex={0} onContextMenu={contextMenu.onContextMenu}>
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
    </section>
  );
}
