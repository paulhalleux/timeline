export type FlexPanelId = string;
export type FlexNodeId = string;

export type FlexDirection = "horizontal" | "vertical";
export type FlexDropPlacement = "left" | "right" | "top" | "bottom" | "center";
export type FlexToolbarSide = "left" | "right";
export type FlexToolbarCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export const flexToolbarCorners = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const satisfies readonly FlexToolbarCorner[];

export interface FlexPanelConstraints {
  readonly canClose?: boolean;
  readonly canMove?: boolean;
  readonly allowedDropPlacements?: readonly FlexDropPlacement[];
  readonly minSize?: number;
  readonly maxSize?: number;
}

export interface FlexPanelDefinition<TMeta = unknown> {
  readonly id: FlexPanelId;
  readonly title?: string;
  readonly icon?: unknown;
  readonly hidden?: boolean;
  readonly constraints?: FlexPanelConstraints;
  readonly meta?: TMeta;
}

export interface FlexSplitChild {
  readonly node: FlexLayoutNode;
  readonly size: number;
}

export interface FlexSplitNode {
  readonly id: FlexNodeId;
  readonly type: "split";
  readonly direction: FlexDirection;
  readonly children: readonly FlexSplitChild[];
}

export interface FlexTabsetNode {
  readonly id: FlexNodeId;
  readonly type: "tabset";
  readonly panels: readonly FlexPanelId[];
  readonly activePanelId?: FlexPanelId;
}

export type FlexLayoutNode = FlexSplitNode | FlexTabsetNode;

export interface FlexToolbarGroup {
  readonly id: string;
  readonly panelIds: readonly FlexPanelId[];
}

export type FlexToolbarState = Readonly<Record<FlexToolbarCorner, readonly FlexToolbarGroup[]>>;

export interface FlexToolbarItemLocation {
  readonly corner: FlexToolbarCorner;
  readonly groupId?: string;
  readonly index?: number;
}

export interface FlexLayoutState<TMeta = unknown> {
  readonly root: FlexLayoutNode | null;
  readonly panels: Readonly<Record<FlexPanelId, FlexPanelDefinition<TMeta>>>;
  readonly hiddenPanelIds: readonly FlexPanelId[];
  readonly toolbars: FlexToolbarState;
}

export interface FlexLayoutOptions<TMeta = unknown> {
  readonly panels: readonly FlexPanelDefinition<TMeta>[];
  readonly root?: FlexLayoutNode | null;
  readonly toolbars?: Partial<Record<FlexToolbarCorner, readonly FlexToolbarGroup[]>>;
}

export interface FlexDropLocation {
  readonly targetPanelId: FlexPanelId;
  readonly placement: FlexDropPlacement;
}

export type FlexLayoutAction<TMeta = unknown> =
  | { readonly type: "hidePanel"; readonly panelId: FlexPanelId }
  | {
      readonly type: "showPanel";
      readonly panelId: FlexPanelId;
      readonly location?: FlexDropLocation;
    }
  | {
      readonly type: "movePanel";
      readonly panelId: FlexPanelId;
      readonly location: FlexDropLocation;
    }
  | { readonly type: "selectPanel"; readonly panelId: FlexPanelId }
  | {
      readonly type: "moveToolbarItem";
      readonly panelId: FlexPanelId;
      readonly location: FlexToolbarItemLocation;
    }
  | {
      readonly type: "resizeSplit";
      readonly splitId: FlexNodeId;
      readonly sizes: readonly number[];
    }
  | {
      readonly type: "registerPanel";
      readonly panel: FlexPanelDefinition<TMeta>;
    }
  | { readonly type: "unregisterPanel"; readonly panelId: FlexPanelId };

export interface FlexLayoutRejected {
  readonly accepted: false;
  readonly reason: string;
}

export interface FlexLayoutAccepted<TMeta = unknown> {
  readonly accepted: true;
  readonly state: FlexLayoutState<TMeta>;
}

export type FlexLayoutResult<TMeta = unknown> =
  | FlexLayoutAccepted<TMeta>
  | FlexLayoutRejected;

export type FlexLayoutSubscriber<TMeta = unknown> = (
  state: FlexLayoutState<TMeta>,
) => void;

export function createFlexLayout<TMeta = unknown>(
  options: FlexLayoutOptions<TMeta>,
): FlexLayoutState<TMeta> {
  const panels = Object.fromEntries(
    options.panels.map((panel) => [panel.id, panel]),
  ) as Record<FlexPanelId, FlexPanelDefinition<TMeta>>;
  const visiblePanelIds = options.panels
    .filter((panel) => panel.hidden !== true)
    .map((panel) => panel.id);
  const hiddenPanelIds = options.panels
    .filter((panel) => panel.hidden === true)
    .map((panel) => panel.id);

  return {
    root:
      options.root === undefined
        ? createTabset(visiblePanelIds, "root")
        : options.root,
    panels,
    hiddenPanelIds,
    toolbars: normalizeToolbars(options.toolbars, options.panels.map((panel) => panel.id)),
  };
}

export function applyFlexLayoutAction<TMeta = unknown>(
  state: FlexLayoutState<TMeta>,
  action: FlexLayoutAction<TMeta>,
): FlexLayoutResult<TMeta> {
  switch (action.type) {
    case "hidePanel":
      return hidePanel(state, action.panelId);
    case "showPanel":
      return showPanel(state, action.panelId, action.location);
    case "movePanel":
      return movePanel(state, action.panelId, action.location);
    case "selectPanel":
      return selectPanel(state, action.panelId);
    case "moveToolbarItem":
      return moveToolbarItem(state, action.panelId, action.location);
    case "resizeSplit":
      return resizeSplit(state, action.splitId, action.sizes);
    case "registerPanel":
      return registerPanel(state, action.panel);
    case "unregisterPanel":
      return unregisterPanel(state, action.panelId);
  }
}

export class FlexLayoutController<TMeta = unknown> {
  private state: FlexLayoutState<TMeta>;
  private readonly subscribers = new Set<FlexLayoutSubscriber<TMeta>>();

  constructor(initialState: FlexLayoutState<TMeta>) {
    this.state = initialState;
  }

  getState(): FlexLayoutState<TMeta> {
    return this.state;
  }

  dispatch(action: FlexLayoutAction<TMeta>): FlexLayoutResult<TMeta> {
    const result = applyFlexLayoutAction(this.state, action);
    if (!result.accepted) return result;
    this.state = result.state;
    for (const subscriber of this.subscribers) subscriber(this.state);
    return result;
  }

  subscribe(subscriber: FlexLayoutSubscriber<TMeta>): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.state);
    return () => this.subscribers.delete(subscriber);
  }
}

export function canDropPanel<TMeta = unknown>(
  state: FlexLayoutState<TMeta>,
  panelId: FlexPanelId,
  location: FlexDropLocation,
): FlexLayoutRejected | { readonly accepted: true } {
  return validateDropPanel(state, panelId, location, true);
}

function validateDropPanel<TMeta = unknown>(
  state: FlexLayoutState<TMeta>,
  panelId: FlexPanelId,
  location: FlexDropLocation,
  enforceMovable: boolean,
): FlexLayoutRejected | { readonly accepted: true } {
  const panel = state.panels[panelId];
  if (!panel) return reject(`Unknown panel: ${panelId}`);
  if (enforceMovable && panel.constraints?.canMove === false) {
    return reject(`Panel cannot be moved: ${panelId}`);
  }
  if (!state.panels[location.targetPanelId]) {
    return reject(`Unknown target panel: ${location.targetPanelId}`);
  }
  if (!findPanelTabset(state.root, location.targetPanelId)) {
    return reject(`Target panel is not visible: ${location.targetPanelId}`);
  }
  if (panelId === location.targetPanelId) {
    return reject("A panel cannot be dropped onto itself");
  }
  const allowed = panel.constraints?.allowedDropPlacements;
  if (allowed && !allowed.includes(location.placement)) {
    return reject(`Drop placement is not allowed: ${location.placement}`);
  }
  return { accepted: true };
}

export function getToolbarPanelIds(
  state: FlexLayoutState,
  corner?: FlexToolbarCorner,
): readonly FlexPanelId[] {
  const corners = corner ? [corner] : flexToolbarCorners;
  return corners.flatMap((key) =>
    state.toolbars[key].flatMap((group) => group.panelIds),
  );
}

export function getVisibleToolbarPanelIds(
  state: FlexLayoutState,
  corner?: FlexToolbarCorner,
): readonly FlexPanelId[] {
  return getToolbarPanelIds(state, corner).filter(
    (panelId) => !state.hiddenPanelIds.includes(panelId),
  );
}

export function getToolbarSideCorners(
  side: FlexToolbarSide,
): readonly [FlexToolbarCorner, FlexToolbarCorner] {
  return side === "left" ? ["top-left", "bottom-left"] : ["top-right", "bottom-right"];
}

export function getVisiblePanelIds(
  state: FlexLayoutState,
): readonly FlexPanelId[] {
  const ids: FlexPanelId[] = [];
  visitLayout(state.root, (node) => {
    if (node.type === "tabset") ids.push(...node.panels);
  });
  return ids;
}

export function findPanelTabset(
  root: FlexLayoutNode | null,
  panelId: FlexPanelId,
): FlexTabsetNode | undefined {
  let found: FlexTabsetNode | undefined;
  visitLayout(root, (node) => {
    if (node.type === "tabset" && node.panels.includes(panelId)) found = node;
  });
  return found;
}

export function createTabset(
  panels: readonly FlexPanelId[],
  id = createNodeId("tabs"),
): FlexTabsetNode {
  return {
    id,
    type: "tabset",
    panels,
    activePanelId: panels[0],
  };
}

export function createSplit(
  direction: FlexDirection,
  children: readonly FlexSplitChild[],
  id = createNodeId("split"),
): FlexSplitNode {
  return {
    id,
    type: "split",
    direction,
    children: distributeSizes(children),
  };
}

function hidePanel<TMeta>(
  state: FlexLayoutState<TMeta>,
  panelId: FlexPanelId,
): FlexLayoutResult<TMeta> {
  const panel = state.panels[panelId];
  if (!panel) return reject(`Unknown panel: ${panelId}`);
  if (panel.constraints?.canClose === false) {
    return reject(`Panel cannot be hidden: ${panelId}`);
  }
  if (state.hiddenPanelIds.includes(panelId)) return accept(state);

  const root = normalizeNode(removePanelFromNode(state.root, panelId));
  return accept({
    ...state,
    root,
    hiddenPanelIds: addUnique(state.hiddenPanelIds, panelId),
  });
}

function showPanel<TMeta>(
  state: FlexLayoutState<TMeta>,
  panelId: FlexPanelId,
  location?: FlexDropLocation,
): FlexLayoutResult<TMeta> {
  if (!state.panels[panelId]) return reject(`Unknown panel: ${panelId}`);
  if (!state.hiddenPanelIds.includes(panelId)) return accept(state);

  const visibleState = {
    ...state,
    hiddenPanelIds: state.hiddenPanelIds.filter((id) => id !== panelId),
  };

  if (!visibleState.root) {
    return accept({ ...visibleState, root: createTabset([panelId], "root") });
  }

  const showLocation = location ?? createDefaultDropLocation(visibleState.root);
  if (!showLocation) return reject("Layout does not contain a tabset");

  return insertVisiblePanel(visibleState, panelId, showLocation, false);
}

function movePanel<TMeta>(
  state: FlexLayoutState<TMeta>,
  panelId: FlexPanelId,
  location: FlexDropLocation,
): FlexLayoutResult<TMeta> {
  const canDrop = canDropPanel(state, panelId, location);
  if (!canDrop.accepted) return canDrop;
  if (state.hiddenPanelIds.includes(panelId)) {
    return reject(`Hidden panel cannot be moved: ${panelId}`);
  }
  if (!findPanelTabset(state.root, panelId)) {
    return reject(`Panel is not visible: ${panelId}`);
  }

  const withoutPanel = normalizeNode(removePanelFromNode(state.root, panelId));
  if (!withoutPanel) return reject("Cannot move the only visible panel");
  const nextState = { ...state, root: withoutPanel };
  return insertVisiblePanel(nextState, panelId, location, true);
}

function insertVisiblePanel<TMeta>(
  state: FlexLayoutState<TMeta>,
  panelId: FlexPanelId,
  location: FlexDropLocation,
  enforceMovable: boolean,
): FlexLayoutResult<TMeta> {
  const canDrop = validateDropPanel(state, panelId, location, enforceMovable);
  if (!canDrop.accepted) return canDrop;
  const inserted = insertPanelIntoNode(state.root, panelId, location);
  if (!inserted.changed) {
    return reject(`Target panel is not visible: ${location.targetPanelId}`);
  }
  return accept({ ...state, root: normalizeNode(inserted.node) });
}

function selectPanel<TMeta>(
  state: FlexLayoutState<TMeta>,
  panelId: FlexPanelId,
): FlexLayoutResult<TMeta> {
  if (!state.panels[panelId]) return reject(`Unknown panel: ${panelId}`);
  if (state.hiddenPanelIds.includes(panelId)) {
    return reject(`Hidden panel cannot be selected: ${panelId}`);
  }
  const selected = selectPanelInNode(state.root, panelId);
  if (!selected.changed) return reject(`Panel is not visible: ${panelId}`);
  return accept({ ...state, root: selected.node });
}

function resizeSplit<TMeta>(
  state: FlexLayoutState<TMeta>,
  splitId: FlexNodeId,
  sizes: readonly number[],
): FlexLayoutResult<TMeta> {
  const split = findSplit(state.root, splitId);
  if (!split) return reject(`Unknown split: ${splitId}`);
  if (sizes.length !== split.children.length) {
    return reject("Resize sizes must match split children length");
  }
  const resized = resizeSplitInNode(state.root, splitId, sizes, state.panels);
  return accept({ ...state, root: resized.node });
}

function registerPanel<TMeta>(
  state: FlexLayoutState<TMeta>,
  panel: FlexPanelDefinition<TMeta>,
): FlexLayoutResult<TMeta> {
  if (state.panels[panel.id]) return reject(`Panel already exists: ${panel.id}`);
  return accept({
    ...state,
    panels: { ...state.panels, [panel.id]: panel },
    hiddenPanelIds: panel.hidden
      ? addUnique(state.hiddenPanelIds, panel.id)
      : state.hiddenPanelIds,
    toolbars: addToolbarPanel(state.toolbars, panel.id),
  });
}

function unregisterPanel<TMeta>(
  state: FlexLayoutState<TMeta>,
  panelId: FlexPanelId,
): FlexLayoutResult<TMeta> {
  if (!state.panels[panelId]) return reject(`Unknown panel: ${panelId}`);
  const panels = { ...state.panels };
  delete panels[panelId];
  return accept({
    root: normalizeNode(removePanelFromNode(state.root, panelId)),
    panels,
    hiddenPanelIds: state.hiddenPanelIds.filter((id) => id !== panelId),
    toolbars: removeToolbarPanel(state.toolbars, panelId),
  });
}


function moveToolbarItem<TMeta>(
  state: FlexLayoutState<TMeta>,
  panelId: FlexPanelId,
  location: FlexToolbarItemLocation,
): FlexLayoutResult<TMeta> {
  const panel = state.panels[panelId];
  if (!panel) return reject(`Unknown panel: ${panelId}`);
  if (panel.constraints?.canMove === false) {
    return reject(`Panel cannot be moved: ${panelId}`);
  }
  if (!flexToolbarCorners.includes(location.corner)) {
    return reject(`Unknown toolbar corner: ${location.corner}`);
  }

  return accept({
    ...state,
    toolbars: movePanelInToolbars(state.toolbars, panelId, location),
  });
}

function insertPanelIntoNode(
  node: FlexLayoutNode | null,
  panelId: FlexPanelId,
  location: FlexDropLocation,
): { readonly node: FlexLayoutNode | null; readonly changed: boolean } {
  if (!node) return { node, changed: false };

  if (node.type === "tabset") {
    if (!node.panels.includes(location.targetPanelId)) {
      return { node, changed: false };
    }
    if (location.placement === "center") {
      return {
        node: {
          ...node,
          panels: insertAfter(node.panels, location.targetPanelId, panelId),
          activePanelId: panelId,
        },
        changed: true,
      };
    }

    const direction =
      location.placement === "left" || location.placement === "right"
        ? "horizontal"
        : "vertical";
    const targetChild = { node, size: 1 };
    const panelChild = { node: createTabset([panelId]), size: 1 };
    const children =
      location.placement === "left" || location.placement === "top"
        ? [panelChild, targetChild]
        : [targetChild, panelChild];
    return { node: createSplit(direction, children), changed: true };
  }

  const children = node.children.map((child) => {
    const inserted = insertPanelIntoNode(child.node, panelId, location);
    return { child: { ...child, node: inserted.node! }, changed: inserted.changed };
  });
  const changed = children.some((child) => child.changed);
  return {
    node: changed
      ? { ...node, children: children.map((child) => child.child) }
      : node,
    changed,
  };
}

function removePanelFromNode(
  node: FlexLayoutNode | null,
  panelId: FlexPanelId,
): FlexLayoutNode | null {
  if (!node) return null;
  if (node.type === "tabset") {
    if (!node.panels.includes(panelId)) return node;
    const panels = node.panels.filter((id) => id !== panelId);
    if (panels.length === 0) return null;
    return {
      ...node,
      panels,
      activePanelId:
        node.activePanelId === panelId ? panels[0] : node.activePanelId,
    };
  }

  return {
    ...node,
    children: node.children
      .map((child) => ({ ...child, node: removePanelFromNode(child.node, panelId) }))
      .filter((child): child is FlexSplitChild => child.node !== null),
  };
}

function normalizeNode(node: FlexLayoutNode | null): FlexLayoutNode | null {
  if (!node) return null;
  if (node.type === "tabset") return node.panels.length === 0 ? null : node;

  const children = node.children
    .map((child) => ({ ...child, node: normalizeNode(child.node) }))
    .filter((child): child is FlexSplitChild => child.node !== null);
  if (children.length === 0) return null;
  if (children.length === 1) return children[0]!.node;

  return { ...node, children: distributeSizes(children) };
}

function selectPanelInNode(
  node: FlexLayoutNode | null,
  panelId: FlexPanelId,
): { readonly node: FlexLayoutNode | null; readonly changed: boolean } {
  if (!node) return { node, changed: false };
  if (node.type === "tabset") {
    if (!node.panels.includes(panelId)) return { node, changed: false };
    return { node: { ...node, activePanelId: panelId }, changed: true };
  }

  const children = node.children.map((child) => {
    const selected = selectPanelInNode(child.node, panelId);
    return { child: { ...child, node: selected.node! }, changed: selected.changed };
  });
  const changed = children.some((child) => child.changed);
  return {
    node: changed
      ? { ...node, children: children.map((child) => child.child) }
      : node,
    changed,
  };
}

function resizeSplitInNode<TMeta>(
  node: FlexLayoutNode | null,
  splitId: FlexNodeId,
  sizes: readonly number[],
  panels: Readonly<Record<FlexPanelId, FlexPanelDefinition<TMeta>>>,
): { readonly node: FlexLayoutNode | null; readonly changed: boolean } {
  if (!node) return { node, changed: false };
  if (node.type === "tabset") return { node, changed: false };

  if (node.id === splitId) {
    return {
      node: {
        ...node,
        children: node.children.map((child, index) => ({
          ...child,
          size: clampSize(sizes[index]!, child.node, panels),
        })),
      },
      changed: true,
    };
  }

  const children = node.children.map((child) => {
    const resized = resizeSplitInNode(child.node, splitId, sizes, panels);
    return { child: { ...child, node: resized.node! }, changed: resized.changed };
  });
  const changed = children.some((child) => child.changed);
  return {
    node: changed
      ? { ...node, children: children.map((child) => child.child) }
      : node,
    changed,
  };
}

function clampSize<TMeta>(
  size: number,
  node: FlexLayoutNode,
  panels: Readonly<Record<FlexPanelId, FlexPanelDefinition<TMeta>>>,
): number {
  const constraints = collectPanelIds(node).map((id) => panels[id]?.constraints);
  const minSize = Math.max(0, ...constraints.map((constraint) => constraint?.minSize ?? 0));
  const maxSize = Math.min(
    Number.POSITIVE_INFINITY,
    ...constraints.map((constraint) => constraint?.maxSize ?? Number.POSITIVE_INFINITY),
  );
  return Math.min(maxSize, Math.max(minSize, size));
}

function collectPanelIds(node: FlexLayoutNode): readonly FlexPanelId[] {
  if (node.type === "tabset") return node.panels;
  return node.children.flatMap((child) => collectPanelIds(child.node));
}

function findSplit(
  node: FlexLayoutNode | null,
  splitId: FlexNodeId,
): FlexSplitNode | undefined {
  if (!node) return undefined;
  if (node.type === "split" && node.id === splitId) return node;
  if (node.type === "tabset") return undefined;
  for (const child of node.children) {
    const found = findSplit(child.node, splitId);
    if (found) return found;
  }
  return undefined;
}

function createDefaultDropLocation(root: FlexLayoutNode): FlexDropLocation | undefined {
  const firstTabset = findFirstTabset(root);
  const targetPanelId = firstTabset?.panels[0];
  return targetPanelId ? { targetPanelId, placement: "center" } : undefined;
}

function findFirstTabset(node: FlexLayoutNode): FlexTabsetNode | undefined {
  if (node.type === "tabset") return node;
  for (const child of node.children) {
    const found = findFirstTabset(child.node);
    if (found) return found;
  }
  return undefined;
}

function distributeSizes(children: readonly FlexSplitChild[]): readonly FlexSplitChild[] {
  const total = children.reduce((sum, child) => sum + Math.max(0, child.size), 0);
  if (total === 0) {
    const evenSize = 1 / children.length;
    return children.map((child) => ({ ...child, size: evenSize }));
  }
  return children.map((child) => ({ ...child, size: Math.max(0, child.size) / total }));
}

function visitLayout(
  node: FlexLayoutNode | null,
  visitor: (node: FlexLayoutNode) => void,
): void {
  if (!node) return;
  visitor(node);
  if (node.type === "split") {
    for (const child of node.children) visitLayout(child.node, visitor);
  }
}

function normalizeToolbars(
  toolbars: Partial<Record<FlexToolbarCorner, readonly FlexToolbarGroup[]>> | undefined,
  panelIds: readonly FlexPanelId[],
): FlexToolbarState {
  const assigned = new Set<FlexPanelId>();
  const normalized = Object.fromEntries(
    flexToolbarCorners.map((corner) => {
      const groups = (toolbars?.[corner] ?? []).map((group, groupIndex) => {
        const ids = group.panelIds.filter((panelId) => {
          if (!panelIds.includes(panelId) || assigned.has(panelId)) return false;
          assigned.add(panelId);
          return true;
        });
        return { id: group.id || `${corner}-${groupIndex}`, panelIds: ids };
      });
      return [corner, groups.filter((group) => group.panelIds.length > 0)];
    }),
  ) as unknown as Record<FlexToolbarCorner, readonly FlexToolbarGroup[]>;

  const unassigned = panelIds.filter((panelId) => !assigned.has(panelId));
  return {
    ...normalized,
    "top-left": [
      ...normalized["top-left"],
      ...(unassigned.length > 0 ? [{ id: "main", panelIds: unassigned }] : []),
    ],
  };
}

function addToolbarPanel(
  toolbars: FlexToolbarState,
  panelId: FlexPanelId,
): FlexToolbarState {
  if (getToolbarPanelIds({ root: null, panels: {}, hiddenPanelIds: [], toolbars }).includes(panelId)) {
    return toolbars;
  }
  return {
    ...toolbars,
    "top-left": appendPanelToToolbarGroups(toolbars["top-left"], panelId),
  };
}

function removeToolbarPanel(
  toolbars: FlexToolbarState,
  panelId: FlexPanelId,
): FlexToolbarState {
  return Object.fromEntries(
    flexToolbarCorners.map((corner) => [corner, removePanelFromToolbarGroups(toolbars[corner], panelId)]),
  ) as Record<FlexToolbarCorner, readonly FlexToolbarGroup[]>;
}

function movePanelInToolbars(
  toolbars: FlexToolbarState,
  panelId: FlexPanelId,
  location: FlexToolbarItemLocation,
): FlexToolbarState {
  const withoutPanel = removeToolbarPanel(toolbars, panelId);
  return {
    ...withoutPanel,
    [location.corner]: insertPanelIntoToolbarGroups(
      withoutPanel[location.corner],
      panelId,
      location,
    ),
  };
}

function appendPanelToToolbarGroups(
  groups: readonly FlexToolbarGroup[],
  panelId: FlexPanelId,
): readonly FlexToolbarGroup[] {
  if (groups.length === 0) return [{ id: "main", panelIds: [panelId] }];
  const [first, ...rest] = groups;
  return [{ ...first!, panelIds: [...first!.panelIds, panelId] }, ...rest];
}

function removePanelFromToolbarGroups(
  groups: readonly FlexToolbarGroup[],
  panelId: FlexPanelId,
): readonly FlexToolbarGroup[] {
  return groups
    .map((group) => ({
      ...group,
      panelIds: group.panelIds.filter((id) => id !== panelId),
    }))
    .filter((group) => group.panelIds.length > 0);
}

function insertPanelIntoToolbarGroups(
  groups: readonly FlexToolbarGroup[],
  panelId: FlexPanelId,
  location: FlexToolbarItemLocation,
): readonly FlexToolbarGroup[] {
  const groupId = location.groupId ?? groups[0]?.id ?? "main";
  const existingGroup = groups.find((group) => group.id === groupId);
  const targetGroup = existingGroup ?? { id: groupId, panelIds: [] };
  const index = Math.max(0, Math.min(location.index ?? targetGroup.panelIds.length, targetGroup.panelIds.length));
  const nextGroup = {
    ...targetGroup,
    panelIds: [
      ...targetGroup.panelIds.slice(0, index),
      panelId,
      ...targetGroup.panelIds.slice(index),
    ],
  };

  if (!existingGroup) return [...groups, nextGroup];
  return groups.map((group) => (group.id === groupId ? nextGroup : group));
}

function insertAfter<T>(items: readonly T[], target: T, item: T): readonly T[] {
  const index = items.indexOf(target);
  return [...items.slice(0, index + 1), item, ...items.slice(index + 1)];
}

function addUnique<T>(items: readonly T[], item: T): readonly T[] {
  return items.includes(item) ? items : [...items, item];
}

function accept<TMeta>(state: FlexLayoutState<TMeta>): FlexLayoutAccepted<TMeta> {
  return { accepted: true, state };
}

function reject(reason: string): FlexLayoutRejected {
  return { accepted: false, reason };
}

let nodeSequence = 0;

function createNodeId(prefix: string): FlexNodeId {
  nodeSequence += 1;
  return `${prefix}-${nodeSequence}`;
}
