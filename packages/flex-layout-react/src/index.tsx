import {
  applyFlexLayoutAction,
  canDropPanel,
  createFlexLayout,
  getToolbarSideCorners,
  type FlexDropLocation,
  type FlexDropPlacement,
  type FlexLayoutAction,
  type FlexLayoutNode,
  type FlexLayoutOptions,
  type FlexLayoutResult,
  type FlexLayoutState,
  type FlexPanelId,
  type FlexSplitNode,
  type FlexTabsetNode,
  type FlexToolbarCorner,
  type FlexToolbarGroup,
  type FlexToolbarSide,
} from "@ptl/flex-layout";
import React from "react";
import { FlexRender } from "./render";
import {
  FlexLayoutContext,
  useFlexLayoutContext,
  type FlexHiddenItemRenderer,
  type FlexLayoutContextValue,
  type FlexPanelRenderer,
  type FlexRenderers,
  type FlexToolbarItemRenderer,
} from "./context";

export { FlexRender } from "./render";
export type {
  FlexHiddenItemRenderer,
  FlexLayoutContextValue,
  FlexPanelRenderer,
  FlexRenderHiddenItemContext,
  FlexRenderItemContext,
  FlexRenderPanelContext,
  FlexToolbarItemRenderer,
} from "./context";

export interface FlexLayoutRootProps<TMeta = unknown>
  extends Omit<React.ComponentProps<"div">, "children"> {
  readonly children?: React.ReactNode;
  readonly defaultState?: FlexLayoutState<TMeta>;
  readonly options?: FlexLayoutOptions<TMeta>;
  readonly state?: FlexLayoutState<TMeta>;
  readonly onStateChange?: (state: FlexLayoutState<TMeta>) => void;
  readonly onDispatch?: (
    action: FlexLayoutAction<TMeta>,
    result: FlexLayoutResult<TMeta>,
  ) => void;
  /** @deprecated Use `<FlexRender.Panel>{panel => ...}</FlexRender.Panel>` instead. */
  readonly renderPanel?: FlexPanelRenderer<TMeta>;
  /** @deprecated Use `<FlexRender.Item>{item => ...}</FlexRender.Item>` instead. */
  readonly renderToolbarItem?: FlexToolbarItemRenderer<TMeta>;
}

export interface FlexLayoutWorkspaceProps extends React.ComponentProps<"div"> {
  readonly node?: FlexLayoutNode | null;
}

export interface FlexLayoutSplitProps extends React.ComponentProps<"div"> {
  readonly node: FlexSplitNode;
}

export interface FlexLayoutTabsetProps extends React.ComponentProps<"section"> {
  readonly node: FlexTabsetNode;
}

export interface FlexLayoutTabListProps extends React.ComponentProps<"div"> {
  readonly node: FlexTabsetNode;
}

export interface FlexLayoutTabProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  readonly panelId: FlexPanelId;
  readonly tabset: FlexTabsetNode;
  readonly children?: React.ReactNode;
}

export interface FlexLayoutPanelProps extends React.ComponentProps<"div"> {
  readonly node: FlexTabsetNode;
}

export interface FlexLayoutResizeHandleProps
  extends React.ComponentProps<"div"> {
  readonly split: FlexSplitNode;
  readonly beforeIndex: number;
}

export interface FlexLayoutCloseTriggerProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  readonly panelId: FlexPanelId;
  readonly children?: React.ReactNode;
}

export interface FlexLayoutHiddenPanelsProps
  extends React.ComponentProps<"div"> {
  /** @deprecated Use `<FlexRender.HiddenItem>{item => ...}</FlexRender.HiddenItem>` instead. */
  readonly renderHiddenPanel?: FlexHiddenItemRenderer;
}

export interface FlexLayoutToolbarSideProps
  extends React.ComponentProps<"aside"> {
  readonly side: FlexToolbarSide;
  readonly renderOverflow?: boolean;
}

export interface FlexLayoutToolbarCornerProps
  extends React.ComponentProps<"div"> {
  readonly corner: FlexToolbarCorner;
}

export interface FlexLayoutToolbarGroupProps
  extends React.ComponentProps<"div"> {
  readonly corner: FlexToolbarCorner;
  readonly group: FlexToolbarGroup;
}

export interface FlexLayoutToolbarItemProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  readonly panelId: FlexPanelId;
  readonly corner: FlexToolbarCorner;
  readonly groupId?: string;
  readonly index?: number;
  readonly children?: React.ReactNode;
}

export interface FlexLayoutToolbarOverflowProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  readonly buttonProps?: React.ComponentProps<"button">;
  readonly menuProps?: React.ComponentProps<"div">;
  readonly children?: React.ReactNode;
}

function FlexLayoutRoot<TMeta = unknown>({
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
}: FlexLayoutRootProps<TMeta>) {
  const initialState = React.useMemo(() => {
    if (defaultState) return defaultState;
    return createFlexLayout(options ?? { panels: [] });
  }, [defaultState, options]);
  const [uncontrolledState, setUncontrolledState] = React.useState(initialState);
  const [draggedPanelId, setDraggedPanelId] = React.useState<FlexPanelId | null>(
    null,
  );
  const [renderers, setRenderers] = React.useState<FlexRenderers<TMeta>>({});
  const state = controlledState ?? uncontrolledState;

  const dispatch = React.useCallback(
    (action: FlexLayoutAction<TMeta>) => {
      const result = applyFlexLayoutAction(state, action);
      if (result.accepted) {
        if (!controlledState) setUncontrolledState(result.state);
        onStateChange?.(result.state);
      }
      onDispatch?.(action, result);
      return result;
    },
    [controlledState, onDispatch, onStateChange, state],
  );

  const registerRenderer = React.useCallback(
    <TSlot extends keyof FlexRenderers<TMeta>>(
      slot: TSlot,
      renderer: NonNullable<FlexRenderers<TMeta>[TSlot]>,
    ) => {
      setRenderers((current) =>
        current[slot] === renderer ? current : { ...current, [slot]: renderer },
      );

      return () => {
        setRenderers((current) => {
          if (current[slot] !== renderer) return current;
          return Object.fromEntries(
            Object.entries(current).filter(([key]) => key !== slot),
          ) as FlexRenderers<TMeta>;
        });
      };
    },
    [],
  );

  const value = React.useMemo(
    () => ({
      state,
      renderPanel,
      renderToolbarItem,
      renderers,
      registerRenderer,
      dispatch,
      draggedPanelId,
      setDraggedPanelId,
    }),
    [
      dispatch,
      draggedPanelId,
      registerRenderer,
      renderPanel,
      renderToolbarItem,
      renderers,
      state,
    ],
  );

  return (
    <FlexLayoutContext.Provider value={value as FlexLayoutContextValue}>
      <div
        data-flex-layout-root=""
        style={{ display: "flex", minHeight: 0, minWidth: 0, ...style }}
        {...rest}
      >
        {children ?? (
          <>
            <FlexLayoutToolbarSide side="left" />
            <FlexLayoutWorkspace />
            <FlexLayoutToolbarSide side="right" />
          </>
        )}
      </div>
    </FlexLayoutContext.Provider>
  );
}

function FlexLayoutWorkspace({ node, style, ...rest }: FlexLayoutWorkspaceProps) {
  const { state } = useFlexLayoutContext();
  const workspaceNode = node === undefined ? state.root : node;

  return (
    <div
      data-flex-layout-workspace=""
      style={{ display: "flex", flex: 1, minHeight: 0, minWidth: 0, ...style }}
      {...rest}
    >
      {workspaceNode ? renderNode(workspaceNode) : null}
    </div>
  );
}

function FlexLayoutSplit({ node, style, ...rest }: FlexLayoutSplitProps) {
  return (
    <div
      data-flex-layout-split=""
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
            data-flex-layout-split-child=""
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
            <FlexLayoutResizeHandle split={node} beforeIndex={index} />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function FlexLayoutResizeHandle({
  split,
  beforeIndex,
  style,
  onPointerDown,
  ...rest
}: FlexLayoutResizeHandleProps) {
  const { dispatch } = useFlexLayoutContext();

  return (
    <div
      role="separator"
      aria-orientation={split.direction}
      data-flex-layout-resize-handle=""
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

function FlexLayoutTabset({
  node,
  style,
  onDragOver,
  onDrop,
  ...rest
}: FlexLayoutTabsetProps) {
  const { draggedPanelId, dispatch, state } = useFlexLayoutContext();

  const getLocation = React.useCallback(
    (event: React.DragEvent<HTMLElement>): FlexDropLocation | null => {
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
      data-flex-layout-tabset=""
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
      <FlexLayoutTabList node={node} />
      <FlexLayoutPanel node={node} />
    </section>
  );
}

function FlexLayoutTabList({ node, ...rest }: FlexLayoutTabListProps) {
  return (
    <div role="tablist" data-flex-layout-tab-list="" {...rest}>
      {node.panels.map((panelId) => (
        <FlexLayoutTab key={panelId} panelId={panelId} tabset={node} />
      ))}
    </div>
  );
}

function FlexLayoutTab({
  panelId,
  tabset,
  children,
  draggable,
  onClick,
  onDragEnd,
  onDragStart,
  ...rest
}: FlexLayoutTabProps) {
  const { dispatch, setDraggedPanelId, state } = useFlexLayoutContext();
  const panel = state.panels[panelId];
  const active = getActivePanelId(tabset) === panelId;
  const canMove = panel?.constraints?.canMove !== false;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-flex-layout-tab=""
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

function FlexLayoutPanel({ node, ...rest }: FlexLayoutPanelProps) {
  const { dispatch, renderers, renderPanel, state } = useFlexLayoutContext();
  const panelId = getActivePanelId(node);
  const panel = state.panels[panelId];
  const renderer = renderers.panel ?? renderPanel;

  return (
    <div role="tabpanel" data-flex-layout-panel="" {...rest}>
      {panel
        ? renderer?.({
            panel,
            panelId,
            state,
            dispatch,
            hide: () => dispatch({ type: "hidePanel", panelId }),
          }) ?? panel.title ?? panel.id
        : null}
    </div>
  );
}

function FlexLayoutCloseTrigger({
  panelId,
  children,
  disabled,
  onClick,
  ...rest
}: FlexLayoutCloseTriggerProps) {
  const { dispatch, state } = useFlexLayoutContext();
  const panel = state.panels[panelId];
  const closeDisabled = disabled === true || panel?.constraints?.canClose === false;

  return (
    <button
      type="button"
      data-flex-layout-close-trigger=""
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

function FlexLayoutHiddenPanels({
  renderHiddenPanel,
  ...rest
}: FlexLayoutHiddenPanelsProps) {
  const { dispatch, renderers, state } = useFlexLayoutContext();
  const renderer = renderers.hiddenItem ?? renderHiddenPanel;

  return (
    <div data-flex-layout-hidden-panels="" {...rest}>
      {state.hiddenPanelIds.map((panelId) => {
        const panel = state.panels[panelId];
        if (!panel) return null;
        const show = () => dispatch({ type: "showPanel", panelId });
        return (
          <React.Fragment key={panelId}>
            {renderer ? (
              renderer({ panel, panelId, state, dispatch, show })
            ) : (
              <button type="button" onClick={show} data-flex-layout-hidden-panel="">
                {panel.title ?? panel.id}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function FlexLayoutToolbarSide({
  side,
  renderOverflow = true,
  style,
  ...rest
}: FlexLayoutToolbarSideProps) {
  const [startCorner, endCorner] = getToolbarSideCorners(side);

  return (
    <aside
      data-flex-layout-toolbar-side=""
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
      <FlexLayoutToolbarCorner corner={startCorner} />
      {renderOverflow ? <FlexLayoutToolbarOverflow /> : null}
      <FlexLayoutToolbarCorner corner={endCorner} />
    </aside>
  );
}

function FlexLayoutToolbarCorner({
  corner,
  style,
  onDragOver,
  onDrop,
  ...rest
}: FlexLayoutToolbarCornerProps) {
  const { draggedPanelId, dispatch, state } = useFlexLayoutContext();
  const groups = state.toolbars[corner];

  return (
    <div
      data-flex-layout-toolbar-corner=""
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
          {groupIndex > 0 ? <FlexLayoutToolbarSeparator /> : null}
          <FlexLayoutToolbarGroup corner={corner} group={group} />
        </React.Fragment>
      ))}
    </div>
  );
}

function FlexLayoutToolbarGroup({
  corner,
  group,
  style,
  ...rest
}: FlexLayoutToolbarGroupProps) {
  return (
    <div
      data-flex-layout-toolbar-group=""
      data-group-id={group.id}
      style={{ display: "flex", flexDirection: "column", ...style }}
      {...rest}
    >
      {group.panelIds.map((panelId, index) => (
        <FlexLayoutToolbarItem
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

function FlexLayoutToolbarItem({
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
}: FlexLayoutToolbarItemProps) {
  const {
    dispatch,
    renderToolbarItem,
    renderers,
    setDraggedPanelId,
    draggedPanelId,
    state,
  } = useFlexLayoutContext();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const panel = state.panels[panelId];
  const active = findActivePanelId(state.root) === panelId;
  const hidden = state.hiddenPanelIds.includes(panelId);
  const canMove = panel?.constraints?.canMove !== false;

  if (!panel || hidden) return null;

  return (
    <span data-flex-layout-toolbar-item-wrapper="">
      <button
        type="button"
        data-flex-layout-toolbar-item=""
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
          (renderers.item ?? renderToolbarItem)?.({
            panel,
            panelId,
            corner,
            groupId,
            index,
            active,
            hidden,
            state,
            dispatch,
            select: () => dispatch({ type: "selectPanel", panelId }),
            hide: () => dispatch({ type: "hidePanel", panelId }),
            moveToCorner: (nextCorner) =>
              dispatch({
                type: "moveToolbarItem",
                panelId,
                location: { corner: nextCorner },
              }),
          }) ??
          panel.title ??
          panel.id}
      </button>
      {menuOpen ? (
        <FlexLayoutToolbarItemMenu
          panelId={panelId}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
    </span>
  );
}

function FlexLayoutToolbarSeparator() {
  return <div role="separator" data-flex-layout-toolbar-separator="" />;
}

function FlexLayoutToolbarItemMenu({
  panelId,
  onClose,
}: {
  readonly panelId: FlexPanelId;
  readonly onClose: () => void;
}) {
  const { dispatch, state } = useFlexLayoutContext();
  const panel = state.panels[panelId];
  if (!panel) return null;

  const moveTo = (corner: FlexToolbarCorner) => {
    dispatch({ type: "moveToolbarItem", panelId, location: { corner } });
    onClose();
  };

  return (
    <div role="menu" data-flex-layout-toolbar-item-menu="">
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
      <div data-flex-layout-toolbar-menu-label="">Move to</div>
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

function FlexLayoutToolbarOverflow({
  buttonProps,
  menuProps,
  children,
  ...rest
}: FlexLayoutToolbarOverflowProps) {
  const { dispatch, renderers, state } = useFlexLayoutContext();
  const [open, setOpen] = React.useState(false);

  return (
    <div data-flex-layout-toolbar-overflow="" {...rest}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        data-flex-layout-toolbar-overflow-trigger=""
        {...buttonProps}
        onClick={(event) => {
          buttonProps?.onClick?.(event);
          if (!event.defaultPrevented) setOpen((value) => !value);
        }}
      >
        {children ?? "…"}
      </button>
      {open ? (
        <div role="menu" data-flex-layout-toolbar-overflow-menu="" {...menuProps}>
          {state.hiddenPanelIds.map((panelId) => {
            const panel = state.panels[panelId];
            if (!panel) return null;
            const show = () => {
              const result = dispatch({ type: "showPanel", panelId });
              if (result.accepted) setOpen(false);
              return result;
            };

            return (
              <React.Fragment key={panelId}>
                {renderers.hiddenItem ? (
                  renderers.hiddenItem({ panel, panelId, state, dispatch, show })
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    data-flex-layout-toolbar-overflow-item=""
                    onClick={show}
                  >
                    {panel.title ?? panel.id}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function useFlexLayout<TMeta = unknown>(): FlexLayoutContextValue<TMeta> {
  return useFlexLayoutContext<TMeta>();
}

export function useFlexLayoutState<TMeta = unknown>(): FlexLayoutState<TMeta> {
  return useFlexLayoutContext<TMeta>().state;
}

export const FlexLayout = {
  Root: FlexLayoutRoot,
  Workspace: FlexLayoutWorkspace,
  Split: FlexLayoutSplit,
  ResizeHandle: FlexLayoutResizeHandle,
  Tabset: FlexLayoutTabset,
  TabList: FlexLayoutTabList,
  Tab: FlexLayoutTab,
  Panel: FlexLayoutPanel,
  CloseTrigger: FlexLayoutCloseTrigger,
  HiddenPanels: FlexLayoutHiddenPanels,
  ToolbarSide: FlexLayoutToolbarSide,
  ToolbarCorner: FlexLayoutToolbarCorner,
  ToolbarGroup: FlexLayoutToolbarGroup,
  ToolbarItem: FlexLayoutToolbarItem,
  ToolbarSeparator: FlexLayoutToolbarSeparator,
  ToolbarItemMenu: FlexLayoutToolbarItemMenu,
  ToolbarOverflow: FlexLayoutToolbarOverflow,
  Render: FlexRender,
  FlexRender,
};

function renderNode(node: FlexLayoutNode): React.ReactNode {
  if (node.type === "split") return <FlexLayoutSplit node={node} />;
  return <FlexLayoutTabset node={node} />;
}

function getActivePanelId(node: FlexTabsetNode): FlexPanelId {
  return node.activePanelId ?? node.panels[0] ?? "";
}

function findActivePanelId(node: FlexLayoutNode | null): FlexPanelId | undefined {
  if (!node) return undefined;
  if (node.type === "tabset") return getActivePanelId(node);
  for (const child of node.children) {
    const panelId = findActivePanelId(child.node);
    if (panelId) return panelId;
  }
  return undefined;
}

function getDropPlacement(event: React.DragEvent<HTMLElement>): FlexDropPlacement {
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

function writeDraggedPanelId(event: React.DragEvent, panelId: FlexPanelId) {
  event.dataTransfer.setData("text/plain", panelId);
  event.dataTransfer.setData("application/x-flex-panel-id", panelId);
}

function readDraggedPanelId(event: React.DragEvent): FlexPanelId | null {
  return (
    event.dataTransfer.getData("application/x-flex-panel-id") ||
    event.dataTransfer.getData("text/plain") ||
    null
  );
}
