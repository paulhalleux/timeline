import {
  applyFlaxLayoutAction,
  canDropPanel,
  createFlaxLayout,
  getToolbarSideCorners,
  type FlaxDropLocation,
  type FlaxDropPlacement,
  type FlaxLayoutAction,
  type FlaxLayoutNode,
  type FlaxLayoutOptions,
  type FlaxLayoutResult,
  type FlaxLayoutState,
  type FlaxPanelDefinition,
  type FlaxPanelId,
  type FlaxSplitNode,
  type FlaxTabsetNode,
  type FlaxToolbarCorner,
  type FlaxToolbarGroup,
  type FlaxToolbarSide,
} from "@ptl/flax-layout";
import React from "react";

export type FlaxPanelRenderer<TMeta = unknown> = (context: {
  readonly panel: FlaxPanelDefinition<TMeta>;
  readonly state: FlaxLayoutState<TMeta>;
  readonly dispatch: (action: FlaxLayoutAction<TMeta>) => FlaxLayoutResult<TMeta>;
}) => React.ReactNode;

export type FlaxToolbarItemRenderer<TMeta = unknown> = (context: {
  readonly panel: FlaxPanelDefinition<TMeta>;
  readonly corner: FlaxToolbarCorner;
  readonly active: boolean;
  readonly hidden: boolean;
  readonly state: FlaxLayoutState<TMeta>;
  readonly dispatch: (action: FlaxLayoutAction<TMeta>) => FlaxLayoutResult<TMeta>;
}) => React.ReactNode;

export interface FlaxLayoutRootProps<TMeta = unknown>
  extends Omit<React.ComponentProps<"div">, "children"> {
  readonly children?: React.ReactNode;
  readonly defaultState?: FlaxLayoutState<TMeta>;
  readonly options?: FlaxLayoutOptions<TMeta>;
  readonly state?: FlaxLayoutState<TMeta>;
  readonly onStateChange?: (state: FlaxLayoutState<TMeta>) => void;
  readonly onDispatch?: (
    action: FlaxLayoutAction<TMeta>,
    result: FlaxLayoutResult<TMeta>,
  ) => void;
  readonly renderPanel: FlaxPanelRenderer<TMeta>;
  readonly renderToolbarItem?: FlaxToolbarItemRenderer<TMeta>;
}

export interface FlaxLayoutTreeProps extends React.ComponentProps<"div"> {
  readonly node?: FlaxLayoutNode | null;
}

export interface FlaxLayoutSplitProps extends React.ComponentProps<"div"> {
  readonly node: FlaxSplitNode;
}

export interface FlaxLayoutTabsetProps extends React.ComponentProps<"section"> {
  readonly node: FlaxTabsetNode;
}

export interface FlaxLayoutTabListProps extends React.ComponentProps<"div"> {
  readonly node: FlaxTabsetNode;
}

export interface FlaxLayoutTabProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  readonly panelId: FlaxPanelId;
  readonly tabset: FlaxTabsetNode;
  readonly children?: React.ReactNode;
}

export interface FlaxLayoutPanelProps extends React.ComponentProps<"div"> {
  readonly node: FlaxTabsetNode;
}

export interface FlaxLayoutResizeHandleProps
  extends React.ComponentProps<"div"> {
  readonly split: FlaxSplitNode;
  readonly beforeIndex: number;
}

export interface FlaxLayoutCloseTriggerProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  readonly panelId: FlaxPanelId;
  readonly children?: React.ReactNode;
}

export interface FlaxLayoutHiddenPanelsProps
  extends React.ComponentProps<"div"> {
  readonly renderHiddenPanel?: (context: {
    readonly panel: FlaxPanelDefinition;
    readonly show: () => void;
  }) => React.ReactNode;
}

export interface FlaxLayoutToolbarSideProps
  extends React.ComponentProps<"aside"> {
  readonly side: FlaxToolbarSide;
  readonly renderOverflow?: boolean;
}

export interface FlaxLayoutToolbarCornerProps
  extends React.ComponentProps<"div"> {
  readonly corner: FlaxToolbarCorner;
}

export interface FlaxLayoutToolbarGroupProps
  extends React.ComponentProps<"div"> {
  readonly corner: FlaxToolbarCorner;
  readonly group: FlaxToolbarGroup;
}

export interface FlaxLayoutToolbarItemProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  readonly panelId: FlaxPanelId;
  readonly corner: FlaxToolbarCorner;
  readonly groupId?: string;
  readonly index?: number;
  readonly children?: React.ReactNode;
}

export interface FlaxLayoutToolbarOverflowProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  readonly buttonProps?: React.ComponentProps<"button">;
  readonly menuProps?: React.ComponentProps<"div">;
  readonly children?: React.ReactNode;
}

export interface FlaxLayoutContextValue<TMeta = unknown> {
  readonly state: FlaxLayoutState<TMeta>;
  readonly renderPanel: FlaxPanelRenderer<TMeta>;
  readonly renderToolbarItem?: FlaxToolbarItemRenderer<TMeta>;
  readonly dispatch: (action: FlaxLayoutAction<TMeta>) => FlaxLayoutResult<TMeta>;
  readonly draggedPanelId: FlaxPanelId | null;
  readonly setDraggedPanelId: (panelId: FlaxPanelId | null) => void;
}

const FlaxLayoutContext = React.createContext<FlaxLayoutContextValue | null>(
  null,
);

function FlaxLayoutRoot<TMeta = unknown>({
  children,
  defaultState,
  options,
  state: controlledState,
  onStateChange,
  onDispatch,
  renderPanel,
  renderToolbarItem,
  style,
  ...rest
}: FlaxLayoutRootProps<TMeta>) {
  const initialState = React.useMemo(() => {
    if (defaultState) return defaultState;
    return createFlaxLayout(options ?? { panels: [] });
  }, [defaultState, options]);
  const [uncontrolledState, setUncontrolledState] = React.useState(initialState);
  const [draggedPanelId, setDraggedPanelId] = React.useState<FlaxPanelId | null>(
    null,
  );
  const state = controlledState ?? uncontrolledState;

  const dispatch = React.useCallback(
    (action: FlaxLayoutAction<TMeta>) => {
      const result = applyFlaxLayoutAction(state, action);
      if (result.accepted) {
        if (!controlledState) setUncontrolledState(result.state);
        onStateChange?.(result.state);
      }
      onDispatch?.(action, result);
      return result;
    },
    [controlledState, onDispatch, onStateChange, state],
  );

  const value = React.useMemo<FlaxLayoutContextValue<TMeta>>(
    () => ({
      state,
      renderPanel,
      renderToolbarItem,
      dispatch,
      draggedPanelId,
      setDraggedPanelId,
    }),
    [dispatch, draggedPanelId, renderPanel, renderToolbarItem, state],
  );

  return (
    <FlaxLayoutContext.Provider value={value as FlaxLayoutContextValue}>
      <div
        data-flax-layout-root=""
        style={{ display: "flex", minHeight: 0, minWidth: 0, ...style }}
        {...rest}
      >
        {children ?? (
          <>
            <FlaxLayoutToolbarSide side="left" />
            <FlaxLayoutTree />
            <FlaxLayoutToolbarSide side="right" />
          </>
        )}
      </div>
    </FlaxLayoutContext.Provider>
  );
}

function FlaxLayoutTree({ node, style, ...rest }: FlaxLayoutTreeProps) {
  const { state } = useFlaxLayoutContext();
  const treeNode = node === undefined ? state.root : node;

  return (
    <div
      data-flax-layout-tree=""
      style={{ display: "flex", flex: 1, minHeight: 0, minWidth: 0, ...style }}
      {...rest}
    >
      {treeNode ? renderNode(treeNode) : null}
    </div>
  );
}

function FlaxLayoutSplit({ node, style, ...rest }: FlaxLayoutSplitProps) {
  return (
    <div
      data-flax-layout-split=""
      data-orientation={node.direction}
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        flexDirection: node.direction === "horizontal" ? "row" : "column",
        ...style,
      }}
      {...rest}
    >
      {node.children.map((child, index) => (
        <React.Fragment key={child.node.id}>
          <div
            data-flax-layout-split-child=""
            style={{
              display: "flex",
              flexBasis: 0,
              flexGrow: child.size,
              minHeight: 0,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {renderNode(child.node)}
          </div>
          {index < node.children.length - 1 ? (
            <FlaxLayoutResizeHandle split={node} beforeIndex={index} />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function FlaxLayoutResizeHandle({
  split,
  beforeIndex,
  style,
  onPointerDown,
  ...rest
}: FlaxLayoutResizeHandleProps) {
  const { dispatch } = useFlaxLayoutContext();

  return (
    <div
      role="separator"
      aria-orientation={split.direction}
      data-flax-layout-resize-handle=""
      data-orientation={split.direction}
      style={{
        flex: "0 0 auto",
        touchAction: "none",
        cursor: split.direction === "horizontal" ? "col-resize" : "row-resize",
        ...style,
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        const container = event.currentTarget.parentElement;
        const rect = container?.getBoundingClientRect();
        if (!rect) return;

        const axisSize = split.direction === "horizontal" ? rect.width : rect.height;
        if (axisSize <= 0) return;

        const start = split.direction === "horizontal" ? event.clientX : event.clientY;
        const pointerId = event.pointerId;
        event.currentTarget.setPointerCapture(pointerId);
        const initialSizes = split.children.map((child) => child.size);

        const onPointerMove = (moveEvent: PointerEvent) => {
          const current =
            split.direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
          const delta = (current - start) / axisSize;
          const sizes = [...initialSizes];
          sizes[beforeIndex] = Math.max(0, initialSizes[beforeIndex]! + delta);
          sizes[beforeIndex + 1] = Math.max(
            0,
            initialSizes[beforeIndex + 1]! - delta,
          );
          dispatch({ type: "resizeSplit", splitId: split.id, sizes });
        };

        const onPointerUp = () => {
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
          window.removeEventListener("pointercancel", onPointerUp);
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
      }}
      {...rest}
    />
  );
}

function FlaxLayoutTabset({
  node,
  style,
  onDragOver,
  onDrop,
  ...rest
}: FlaxLayoutTabsetProps) {
  const { draggedPanelId, dispatch, state } = useFlaxLayoutContext();

  const getLocation = React.useCallback(
    (event: React.DragEvent<HTMLElement>): FlaxDropLocation | null => {
      const panelId = draggedPanelId ?? readDraggedPanelId(event);
      if (!panelId) return null;
      return {
        targetPanelId: getActivePanelId(node),
        placement: getDropPlacement(event),
      };
    },
    [draggedPanelId, node],
  );

  return (
    <section
      data-flax-layout-tabset=""
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minHeight: 0,
        minWidth: 0,
        ...style,
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (event.defaultPrevented) return;
        const panelId = draggedPanelId ?? readDraggedPanelId(event);
        const location = getLocation(event);
        if (!panelId || !location) return;
        const result = canDropPanel(state, panelId, location);
        if (!result.accepted) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        onDrop?.(event);
        if (event.defaultPrevented) return;
        const panelId = draggedPanelId ?? readDraggedPanelId(event);
        const location = getLocation(event);
        if (!panelId || !location) return;
        event.preventDefault();
        dispatch({ type: "movePanel", panelId, location });
      }}
      {...rest}
    >
      <FlaxLayoutTabList node={node} />
      <FlaxLayoutPanel node={node} />
    </section>
  );
}

function FlaxLayoutTabList({ node, ...rest }: FlaxLayoutTabListProps) {
  return (
    <div role="tablist" data-flax-layout-tab-list="" {...rest}>
      {node.panels.map((panelId) => (
        <FlaxLayoutTab key={panelId} panelId={panelId} tabset={node} />
      ))}
    </div>
  );
}

function FlaxLayoutTab({
  panelId,
  tabset,
  children,
  draggable,
  onClick,
  onDragEnd,
  onDragStart,
  ...rest
}: FlaxLayoutTabProps) {
  const { dispatch, setDraggedPanelId, state } = useFlaxLayoutContext();
  const panel = state.panels[panelId];
  const active = getActivePanelId(tabset) === panelId;
  const canMove = panel?.constraints?.canMove !== false;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-flax-layout-tab=""
      data-active={active ? "" : undefined}
      draggable={draggable ?? canMove}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) dispatch({ type: "selectPanel", panelId });
      }}
      onDragStart={(event) => {
        onDragStart?.(event);
        if (event.defaultPrevented || !canMove) return;
        setDraggedPanelId(panelId);
        event.dataTransfer.effectAllowed = "move";
        writeDraggedPanelId(event, panelId);
      }}
      onDragEnd={(event) => {
        onDragEnd?.(event);
        setDraggedPanelId(null);
      }}
      {...rest}
    >
      {children ?? panel?.title ?? panelId}
    </button>
  );
}

function FlaxLayoutPanel({ node, ...rest }: FlaxLayoutPanelProps) {
  const { dispatch, renderPanel, state } = useFlaxLayoutContext();
  const panelId = getActivePanelId(node);
  const panel = state.panels[panelId];

  return (
    <div role="tabpanel" data-flax-layout-panel="" {...rest}>
      {panel ? renderPanel({ panel, state, dispatch }) : null}
    </div>
  );
}

function FlaxLayoutCloseTrigger({
  panelId,
  children,
  disabled,
  onClick,
  ...rest
}: FlaxLayoutCloseTriggerProps) {
  const { dispatch, state } = useFlaxLayoutContext();
  const panel = state.panels[panelId];
  const closeDisabled = disabled === true || panel?.constraints?.canClose === false;

  return (
    <button
      type="button"
      data-flax-layout-close-trigger=""
      disabled={closeDisabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) dispatch({ type: "hidePanel", panelId });
      }}
      {...rest}
    >
      {children ?? "Close"}
    </button>
  );
}

function FlaxLayoutHiddenPanels({
  renderHiddenPanel,
  ...rest
}: FlaxLayoutHiddenPanelsProps) {
  const { dispatch, state } = useFlaxLayoutContext();

  return (
    <div data-flax-layout-hidden-panels="" {...rest}>
      {state.hiddenPanelIds.map((panelId) => {
        const panel = state.panels[panelId];
        if (!panel) return null;
        const show = () => dispatch({ type: "showPanel", panelId });
        return (
          <React.Fragment key={panelId}>
            {renderHiddenPanel ? (
              renderHiddenPanel({ panel, show })
            ) : (
              <button type="button" onClick={show} data-flax-layout-hidden-panel="">
                {panel.title ?? panel.id}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function FlaxLayoutToolbarSide({
  side,
  renderOverflow = true,
  style,
  ...rest
}: FlaxLayoutToolbarSideProps) {
  const [startCorner, endCorner] = getToolbarSideCorners(side);

  return (
    <aside
      data-flax-layout-toolbar-side=""
      data-side={side}
      style={{
        display: "flex",
        flex: "0 0 auto",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 0,
        ...style,
      }}
      {...rest}
    >
      <FlaxLayoutToolbarCorner corner={startCorner} />
      {renderOverflow ? <FlaxLayoutToolbarOverflow /> : null}
      <FlaxLayoutToolbarCorner corner={endCorner} />
    </aside>
  );
}

function FlaxLayoutToolbarCorner({
  corner,
  style,
  onDragOver,
  onDrop,
  ...rest
}: FlaxLayoutToolbarCornerProps) {
  const { draggedPanelId, dispatch, state } = useFlaxLayoutContext();
  const groups = state.toolbars[corner];

  return (
    <div
      data-flax-layout-toolbar-corner=""
      data-corner={corner}
      style={{ display: "flex", flexDirection: "column", ...style }}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (event.defaultPrevented) return;
        const panelId = draggedPanelId ?? readDraggedPanelId(event);
        if (!panelId || state.panels[panelId]?.constraints?.canMove === false) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        onDrop?.(event);
        if (event.defaultPrevented) return;
        const panelId = draggedPanelId ?? readDraggedPanelId(event);
        if (!panelId) return;
        event.preventDefault();
        dispatch({ type: "moveToolbarItem", panelId, location: { corner } });
      }}
      {...rest}
    >
      {groups.map((group, groupIndex) => (
        <React.Fragment key={group.id}>
          {groupIndex > 0 ? <FlaxLayoutToolbarSeparator /> : null}
          <FlaxLayoutToolbarGroup corner={corner} group={group} />
        </React.Fragment>
      ))}
    </div>
  );
}

function FlaxLayoutToolbarGroup({
  corner,
  group,
  style,
  ...rest
}: FlaxLayoutToolbarGroupProps) {
  return (
    <div
      data-flax-layout-toolbar-group=""
      data-group-id={group.id}
      style={{ display: "flex", flexDirection: "column", ...style }}
      {...rest}
    >
      {group.panelIds.map((panelId, index) => (
        <FlaxLayoutToolbarItem
          key={panelId}
          panelId={panelId}
          corner={corner}
          groupId={group.id}
          index={index}
        />
      ))}
    </div>
  );
}

function FlaxLayoutToolbarItem({
  panelId,
  corner,
  groupId,
  index = 0,
  children,
  draggable,
  onClick,
  onContextMenu,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  ...rest
}: FlaxLayoutToolbarItemProps) {
  const {
    dispatch,
    renderToolbarItem,
    setDraggedPanelId,
    draggedPanelId,
    state,
  } = useFlaxLayoutContext();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const panel = state.panels[panelId];
  const active = findActivePanelId(state.root) === panelId;
  const hidden = state.hiddenPanelIds.includes(panelId);
  const canMove = panel?.constraints?.canMove !== false;

  if (!panel || hidden) return null;

  return (
    <span data-flax-layout-toolbar-item-wrapper="">
      <button
        type="button"
        data-flax-layout-toolbar-item=""
        data-active={active ? "" : undefined}
        data-corner={corner}
        draggable={draggable ?? canMove}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) dispatch({ type: "selectPanel", panelId });
        }}
        onContextMenu={(event) => {
          onContextMenu?.(event);
          if (event.defaultPrevented) return;
          event.preventDefault();
          setMenuOpen((open) => !open);
        }}
        onDragStart={(event) => {
          onDragStart?.(event);
          if (event.defaultPrevented || !canMove) return;
          setDraggedPanelId(panelId);
          event.dataTransfer.effectAllowed = "move";
          writeDraggedPanelId(event, panelId);
        }}
        onDragOver={(event) => {
          onDragOver?.(event);
          if (event.defaultPrevented) return;
          const draggedId = draggedPanelId ?? readDraggedPanelId(event);
          if (!draggedId || state.panels[draggedId]?.constraints?.canMove === false) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        onDrop={(event) => {
          onDrop?.(event);
          if (event.defaultPrevented) return;
          const draggedId = draggedPanelId ?? readDraggedPanelId(event);
          if (!draggedId) return;
          event.preventDefault();
          dispatch({
            type: "moveToolbarItem",
            panelId: draggedId,
            location: { corner, groupId, index: getToolbarDropIndex(event, index) },
          });
        }}
        onDragEnd={(event) => {
          onDragEnd?.(event);
          setDraggedPanelId(null);
        }}
        {...rest}
      >
        {children ??
          renderToolbarItem?.({ panel, corner, active, hidden, state, dispatch }) ??
          panel.title ??
          panel.id}
      </button>
      {menuOpen ? (
        <FlaxLayoutToolbarItemMenu
          panelId={panelId}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
    </span>
  );
}

function FlaxLayoutToolbarSeparator() {
  return <div role="separator" data-flax-layout-toolbar-separator="" />;
}

function FlaxLayoutToolbarItemMenu({
  panelId,
  onClose,
}: {
  readonly panelId: FlaxPanelId;
  readonly onClose: () => void;
}) {
  const { dispatch, state } = useFlaxLayoutContext();
  const panel = state.panels[panelId];
  if (!panel) return null;

  const moveTo = (corner: FlaxToolbarCorner) => {
    dispatch({ type: "moveToolbarItem", panelId, location: { corner } });
    onClose();
  };

  return (
    <div role="menu" data-flax-layout-toolbar-item-menu="">
      <button
        type="button"
        role="menuitem"
        disabled={panel.constraints?.canClose === false}
        onClick={() => {
          dispatch({ type: "hidePanel", panelId });
          onClose();
        }}
      >
        Hide
      </button>
      <div data-flax-layout-toolbar-menu-label="">Move to</div>
      <button type="button" role="menuitem" onClick={() => moveTo("top-left")}>
        Top left
      </button>
      <button type="button" role="menuitem" onClick={() => moveTo("bottom-left")}>
        Bottom left
      </button>
      <button type="button" role="menuitem" onClick={() => moveTo("top-right")}>
        Top right
      </button>
      <button type="button" role="menuitem" onClick={() => moveTo("bottom-right")}>
        Bottom right
      </button>
    </div>
  );
}

function FlaxLayoutToolbarOverflow({
  buttonProps,
  menuProps,
  children,
  ...rest
}: FlaxLayoutToolbarOverflowProps) {
  const { dispatch, state } = useFlaxLayoutContext();
  const [open, setOpen] = React.useState(false);

  return (
    <div data-flax-layout-toolbar-overflow="" {...rest}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        data-flax-layout-toolbar-overflow-trigger=""
        {...buttonProps}
        onClick={(event) => {
          buttonProps?.onClick?.(event);
          if (!event.defaultPrevented) setOpen((value) => !value);
        }}
      >
        {children ?? "…"}
      </button>
      {open ? (
        <div role="menu" data-flax-layout-toolbar-overflow-menu="" {...menuProps}>
          {state.hiddenPanelIds.map((panelId) => {
            const panel = state.panels[panelId];
            if (!panel) return null;
            return (
              <button
                key={panelId}
                type="button"
                role="menuitem"
                data-flax-layout-toolbar-overflow-item=""
                onClick={() => {
                  dispatch({ type: "showPanel", panelId });
                  setOpen(false);
                }}
              >
                {panel.title ?? panel.id}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function useFlaxLayout<TMeta = unknown>(): FlaxLayoutContextValue<TMeta> {
  return useFlaxLayoutContext<TMeta>();
}

export function useFlaxLayoutState<TMeta = unknown>(): FlaxLayoutState<TMeta> {
  return useFlaxLayoutContext<TMeta>().state;
}

export const FlaxLayout = {
  Root: FlaxLayoutRoot,
  Tree: FlaxLayoutTree,
  Split: FlaxLayoutSplit,
  ResizeHandle: FlaxLayoutResizeHandle,
  Tabset: FlaxLayoutTabset,
  TabList: FlaxLayoutTabList,
  Tab: FlaxLayoutTab,
  Panel: FlaxLayoutPanel,
  CloseTrigger: FlaxLayoutCloseTrigger,
  HiddenPanels: FlaxLayoutHiddenPanels,
  ToolbarSide: FlaxLayoutToolbarSide,
  ToolbarCorner: FlaxLayoutToolbarCorner,
  ToolbarGroup: FlaxLayoutToolbarGroup,
  ToolbarItem: FlaxLayoutToolbarItem,
  ToolbarSeparator: FlaxLayoutToolbarSeparator,
  ToolbarItemMenu: FlaxLayoutToolbarItemMenu,
  ToolbarOverflow: FlaxLayoutToolbarOverflow,
};

function useFlaxLayoutContext<TMeta = unknown>(): FlaxLayoutContextValue<TMeta> {
  const context = React.useContext(FlaxLayoutContext);
  if (!context) {
    throw new Error("FlaxLayout primitives must be rendered inside FlaxLayout.Root");
  }
  return context as FlaxLayoutContextValue<TMeta>;
}

function renderNode(node: FlaxLayoutNode): React.ReactNode {
  if (node.type === "split") return <FlaxLayoutSplit node={node} />;
  return <FlaxLayoutTabset node={node} />;
}

function getActivePanelId(node: FlaxTabsetNode): FlaxPanelId {
  return node.activePanelId ?? node.panels[0] ?? "";
}

function findActivePanelId(node: FlaxLayoutNode | null): FlaxPanelId | undefined {
  if (!node) return undefined;
  if (node.type === "tabset") return getActivePanelId(node);
  for (const child of node.children) {
    const panelId = findActivePanelId(child.node);
    if (panelId) return panelId;
  }
  return undefined;
}

function getDropPlacement(event: React.DragEvent<HTMLElement>): FlaxDropPlacement {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / Math.max(1, rect.width);
  const y = (event.clientY - rect.top) / Math.max(1, rect.height);
  const edge = 0.25;

  if (x < edge) return "left";
  if (x > 1 - edge) return "right";
  if (y < edge) return "top";
  if (y > 1 - edge) return "bottom";
  return "center";
}

function getToolbarDropIndex(event: React.DragEvent<HTMLElement>, index: number): number {
  const rect = event.currentTarget.getBoundingClientRect();
  const y = (event.clientY - rect.top) / Math.max(1, rect.height);
  return y > 0.5 ? index + 1 : index;
}

function writeDraggedPanelId(event: React.DragEvent, panelId: FlaxPanelId) {
  event.dataTransfer.setData("text/plain", panelId);
  event.dataTransfer.setData("application/x-flax-panel-id", panelId);
}

function readDraggedPanelId(event: React.DragEvent): FlaxPanelId | null {
  return (
    event.dataTransfer.getData("application/x-flax-panel-id") ||
    event.dataTransfer.getData("text/plain") ||
    null
  );
}
