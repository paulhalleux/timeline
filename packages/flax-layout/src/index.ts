export type FlaxPanelId = string;
export type FlaxNodeId = string;

export type FlaxDirection = "horizontal" | "vertical";
export type FlaxDropPlacement = "left" | "right" | "top" | "bottom" | "center";
export type FlaxToolbarSide = "left" | "right";
export type FlaxToolbarCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export const flaxToolbarCorners = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const satisfies readonly FlaxToolbarCorner[];

export interface FlaxPanelConstraints {
  readonly canClose?: boolean;
  readonly canMove?: boolean;
  readonly allowedDropPlacements?: readonly FlaxDropPlacement[];
  readonly minSize?: number;
  readonly maxSize?: number;
}

export interface FlaxPanelDefinition<TMeta = unknown> {
  readonly id: FlaxPanelId;
  readonly title?: string;
  readonly icon?: unknown;
  readonly hidden?: boolean;
  readonly constraints?: FlaxPanelConstraints;
  readonly meta?: TMeta;
}

export interface FlaxSplitChild {
  readonly node: FlaxLayoutNode;
  readonly size: number;
}

export interface FlaxSplitNode {
  readonly id: FlaxNodeId;
  readonly type: "split";
  readonly direction: FlaxDirection;
  readonly children: readonly FlaxSplitChild[];
}

export interface FlaxTabsetNode {
  readonly id: FlaxNodeId;
  readonly type: "tabset";
  readonly panels: readonly FlaxPanelId[];
  readonly activePanelId?: FlaxPanelId;
}

export type FlaxLayoutNode = FlaxSplitNode | FlaxTabsetNode;

export interface FlaxToolbarGroup {
  readonly id: string;
  readonly panelIds: readonly FlaxPanelId[];
}

export type FlaxToolbarState = Readonly<Record<FlaxToolbarCorner, readonly FlaxToolbarGroup[]>>;

export interface FlaxToolbarItemLocation {
  readonly corner: FlaxToolbarCorner;
  readonly groupId?: string;
  readonly index?: number;
}

export interface FlaxLayoutState<TMeta = unknown> {
  readonly root: FlaxLayoutNode | null;
  readonly panels: Readonly<Record<FlaxPanelId, FlaxPanelDefinition<TMeta>>>;
  readonly hiddenPanelIds: readonly FlaxPanelId[];
  readonly toolbars: FlaxToolbarState;
}

export interface FlaxLayoutOptions<TMeta = unknown> {
  readonly panels: readonly FlaxPanelDefinition<TMeta>[];
  readonly root?: FlaxLayoutNode | null;
  readonly toolbars?: Partial<Record<FlaxToolbarCorner, readonly FlaxToolbarGroup[]>>;
}

export interface FlaxDropLocation {
  readonly targetPanelId: FlaxPanelId;
  readonly placement: FlaxDropPlacement;
}

export type FlaxLayoutAction<TMeta = unknown> =
  | { readonly type: "hidePanel"; readonly panelId: FlaxPanelId }
  | {
      readonly type: "showPanel";
      readonly panelId: FlaxPanelId;
      readonly location?: FlaxDropLocation;
    }
  | {
      readonly type: "movePanel";
      readonly panelId: FlaxPanelId;
      readonly location: FlaxDropLocation;
    }
  | { readonly type: "selectPanel"; readonly panelId: FlaxPanelId }
  | {
      readonly type: "moveToolbarItem";
      readonly panelId: FlaxPanelId;
      readonly location: FlaxToolbarItemLocation;
    }
  | {
      readonly type: "resizeSplit";
      readonly splitId: FlaxNodeId;
      readonly sizes: readonly number[];
    }
  | {
      readonly type: "registerPanel";
      readonly panel: FlaxPanelDefinition<TMeta>;
    }
  | { readonly type: "unregisterPanel"; readonly panelId: FlaxPanelId };

export interface FlaxLayoutRejected {
  readonly accepted: false;
  readonly reason: string;
}

export interface FlaxLayoutAccepted<TMeta = unknown> {
  readonly accepted: true;
  readonly state: FlaxLayoutState<TMeta>;
}

export type FlaxLayoutResult<TMeta = unknown> =
  | FlaxLayoutAccepted<TMeta>
  | FlaxLayoutRejected;

export type FlaxLayoutSubscriber<TMeta = unknown> = (
  state: FlaxLayoutState<TMeta>,
) => void;

export function createFlaxLayout<TMeta = unknown>(
  options: FlaxLayoutOptions<TMeta>,
): FlaxLayoutState<TMeta> {
  const panels = Object.fromEntries(
    options.panels.map((panel) => [panel.id, panel]),
  ) as Record<FlaxPanelId, FlaxPanelDefinition<TMeta>>;
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

export function applyFlaxLayoutAction<TMeta = unknown>(
  state: FlaxLayoutState<TMeta>,
  action: FlaxLayoutAction<TMeta>,
): FlaxLayoutResult<TMeta> {
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

export class FlaxLayoutController<TMeta = unknown> {
  private state: FlaxLayoutState<TMeta>;
  private readonly subscribers = new Set<FlaxLayoutSubscriber<TMeta>>();

  constructor(initialState: FlaxLayoutState<TMeta>) {
    this.state = initialState;
  }

  getState(): FlaxLayoutState<TMeta> {
    return this.state;
  }

  dispatch(action: FlaxLayoutAction<TMeta>): FlaxLayoutResult<TMeta> {
    const result = applyFlaxLayoutAction(this.state, action);
    if (!result.accepted) return result;
    this.state = result.state;
    for (const subscriber of this.subscribers) subscriber(this.state);
    return result;
  }

  subscribe(subscriber: FlaxLayoutSubscriber<TMeta>): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.state);
    return () => this.subscribers.delete(subscriber);
  }
}

export function canDropPanel<TMeta = unknown>(
  state: FlaxLayoutState<TMeta>,
  panelId: FlaxPanelId,
  location: FlaxDropLocation,
): FlaxLayoutRejected | { readonly accepted: true } {
  return validateDropPanel(state, panelId, location, true);
}

function validateDropPanel<TMeta = unknown>(
  state: FlaxLayoutState<TMeta>,
  panelId: FlaxPanelId,
  location: FlaxDropLocation,
  enforceMovable: boolean,
): FlaxLayoutRejected | { readonly accepted: true } {
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
  state: FlaxLayoutState,
  corner?: FlaxToolbarCorner,
): readonly FlaxPanelId[] {
  const corners = corner ? [corner] : flaxToolbarCorners;
  return corners.flatMap((key) =>
    state.toolbars[key].flatMap((group) => group.panelIds),
  );
}

export function getVisibleToolbarPanelIds(
  state: FlaxLayoutState,
  corner?: FlaxToolbarCorner,
): readonly FlaxPanelId[] {
  return getToolbarPanelIds(state, corner).filter(
    (panelId) => !state.hiddenPanelIds.includes(panelId),
  );
}

export function getToolbarSideCorners(
  side: FlaxToolbarSide,
): readonly [FlaxToolbarCorner, FlaxToolbarCorner] {
  return side === "left" ? ["top-left", "bottom-left"] : ["top-right", "bottom-right"];
}

export function getVisiblePanelIds(
  state: FlaxLayoutState,
): readonly FlaxPanelId[] {
  const ids: FlaxPanelId[] = [];
  visitLayout(state.root, (node) => {
    if (node.type === "tabset") ids.push(...node.panels);
  });
  return ids;
}

export function findPanelTabset(
  root: FlaxLayoutNode | null,
  panelId: FlaxPanelId,
): FlaxTabsetNode | undefined {
  let found: FlaxTabsetNode | undefined;
  visitLayout(root, (node) => {
    if (node.type === "tabset" && node.panels.includes(panelId)) found = node;
  });
  return found;
}

export function createTabset(
  panels: readonly FlaxPanelId[],
  id = createNodeId("tabs"),
): FlaxTabsetNode {
  return {
    id,
    type: "tabset",
    panels,
    activePanelId: panels[0],
  };
}

export function createSplit(
  direction: FlaxDirection,
  children: readonly FlaxSplitChild[],
  id = createNodeId("split"),
): FlaxSplitNode {
  return {
    id,
    type: "split",
    direction,
    children: distributeSizes(children),
  };
}

function hidePanel<TMeta>(
  state: FlaxLayoutState<TMeta>,
  panelId: FlaxPanelId,
): FlaxLayoutResult<TMeta> {
  const panel = state.panels[panelId];
  if (!panel) return reject(`Unknown panel: ${panelId}`);
  if (panel.constraints?.canClose === false) {
    return reject(`Panel cannot be hidden: ${panelId}`);
  }
  if (state.hiddenPanelIds.includes(panelId)) return accept(state);

  const root = normalizeTree(removePanelFromTree(state.root, panelId));
  return accept({
    ...state,
    root,
    hiddenPanelIds: addUnique(state.hiddenPanelIds, panelId),
  });
}

function showPanel<TMeta>(
  state: FlaxLayoutState<TMeta>,
  panelId: FlaxPanelId,
  location?: FlaxDropLocation,
): FlaxLayoutResult<TMeta> {
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
  state: FlaxLayoutState<TMeta>,
  panelId: FlaxPanelId,
  location: FlaxDropLocation,
): FlaxLayoutResult<TMeta> {
  const canDrop = canDropPanel(state, panelId, location);
  if (!canDrop.accepted) return canDrop;
  if (state.hiddenPanelIds.includes(panelId)) {
    return reject(`Hidden panel cannot be moved: ${panelId}`);
  }
  if (!findPanelTabset(state.root, panelId)) {
    return reject(`Panel is not visible: ${panelId}`);
  }

  const withoutPanel = normalizeTree(removePanelFromTree(state.root, panelId));
  if (!withoutPanel) return reject("Cannot move the only visible panel");
  const nextState = { ...state, root: withoutPanel };
  return insertVisiblePanel(nextState, panelId, location, true);
}

function insertVisiblePanel<TMeta>(
  state: FlaxLayoutState<TMeta>,
  panelId: FlaxPanelId,
  location: FlaxDropLocation,
  enforceMovable: boolean,
): FlaxLayoutResult<TMeta> {
  const canDrop = validateDropPanel(state, panelId, location, enforceMovable);
  if (!canDrop.accepted) return canDrop;
  const inserted = insertPanelIntoTree(state.root, panelId, location);
  if (!inserted.changed) {
    return reject(`Target panel is not visible: ${location.targetPanelId}`);
  }
  return accept({ ...state, root: normalizeTree(inserted.node) });
}

function selectPanel<TMeta>(
  state: FlaxLayoutState<TMeta>,
  panelId: FlaxPanelId,
): FlaxLayoutResult<TMeta> {
  if (!state.panels[panelId]) return reject(`Unknown panel: ${panelId}`);
  if (state.hiddenPanelIds.includes(panelId)) {
    return reject(`Hidden panel cannot be selected: ${panelId}`);
  }
  const selected = selectPanelInTree(state.root, panelId);
  if (!selected.changed) return reject(`Panel is not visible: ${panelId}`);
  return accept({ ...state, root: selected.node });
}

function resizeSplit<TMeta>(
  state: FlaxLayoutState<TMeta>,
  splitId: FlaxNodeId,
  sizes: readonly number[],
): FlaxLayoutResult<TMeta> {
  const split = findSplit(state.root, splitId);
  if (!split) return reject(`Unknown split: ${splitId}`);
  if (sizes.length !== split.children.length) {
    return reject("Resize sizes must match split children length");
  }
  const resized = resizeSplitInTree(state.root, splitId, sizes, state.panels);
  return accept({ ...state, root: resized.node });
}

function registerPanel<TMeta>(
  state: FlaxLayoutState<TMeta>,
  panel: FlaxPanelDefinition<TMeta>,
): FlaxLayoutResult<TMeta> {
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
  state: FlaxLayoutState<TMeta>,
  panelId: FlaxPanelId,
): FlaxLayoutResult<TMeta> {
  if (!state.panels[panelId]) return reject(`Unknown panel: ${panelId}`);
  const panels = { ...state.panels };
  delete panels[panelId];
  return accept({
    root: normalizeTree(removePanelFromTree(state.root, panelId)),
    panels,
    hiddenPanelIds: state.hiddenPanelIds.filter((id) => id !== panelId),
    toolbars: removeToolbarPanel(state.toolbars, panelId),
  });
}


function moveToolbarItem<TMeta>(
  state: FlaxLayoutState<TMeta>,
  panelId: FlaxPanelId,
  location: FlaxToolbarItemLocation,
): FlaxLayoutResult<TMeta> {
  const panel = state.panels[panelId];
  if (!panel) return reject(`Unknown panel: ${panelId}`);
  if (panel.constraints?.canMove === false) {
    return reject(`Panel cannot be moved: ${panelId}`);
  }
  if (!flaxToolbarCorners.includes(location.corner)) {
    return reject(`Unknown toolbar corner: ${location.corner}`);
  }

  return accept({
    ...state,
    toolbars: movePanelInToolbars(state.toolbars, panelId, location),
  });
}

function insertPanelIntoTree(
  node: FlaxLayoutNode | null,
  panelId: FlaxPanelId,
  location: FlaxDropLocation,
): { readonly node: FlaxLayoutNode | null; readonly changed: boolean } {
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
    const inserted = insertPanelIntoTree(child.node, panelId, location);
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

function removePanelFromTree(
  node: FlaxLayoutNode | null,
  panelId: FlaxPanelId,
): FlaxLayoutNode | null {
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
      .map((child) => ({ ...child, node: removePanelFromTree(child.node, panelId) }))
      .filter((child): child is FlaxSplitChild => child.node !== null),
  };
}

function normalizeTree(node: FlaxLayoutNode | null): FlaxLayoutNode | null {
  if (!node) return null;
  if (node.type === "tabset") return node.panels.length === 0 ? null : node;

  const children = node.children
    .map((child) => ({ ...child, node: normalizeTree(child.node) }))
    .filter((child): child is FlaxSplitChild => child.node !== null);
  if (children.length === 0) return null;
  if (children.length === 1) return children[0]!.node;

  return { ...node, children: distributeSizes(children) };
}

function selectPanelInTree(
  node: FlaxLayoutNode | null,
  panelId: FlaxPanelId,
): { readonly node: FlaxLayoutNode | null; readonly changed: boolean } {
  if (!node) return { node, changed: false };
  if (node.type === "tabset") {
    if (!node.panels.includes(panelId)) return { node, changed: false };
    return { node: { ...node, activePanelId: panelId }, changed: true };
  }

  const children = node.children.map((child) => {
    const selected = selectPanelInTree(child.node, panelId);
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

function resizeSplitInTree<TMeta>(
  node: FlaxLayoutNode | null,
  splitId: FlaxNodeId,
  sizes: readonly number[],
  panels: Readonly<Record<FlaxPanelId, FlaxPanelDefinition<TMeta>>>,
): { readonly node: FlaxLayoutNode | null; readonly changed: boolean } {
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
    const resized = resizeSplitInTree(child.node, splitId, sizes, panels);
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
  node: FlaxLayoutNode,
  panels: Readonly<Record<FlaxPanelId, FlaxPanelDefinition<TMeta>>>,
): number {
  const constraints = collectPanelIds(node).map((id) => panels[id]?.constraints);
  const minSize = Math.max(0, ...constraints.map((constraint) => constraint?.minSize ?? 0));
  const maxSize = Math.min(
    Number.POSITIVE_INFINITY,
    ...constraints.map((constraint) => constraint?.maxSize ?? Number.POSITIVE_INFINITY),
  );
  return Math.min(maxSize, Math.max(minSize, size));
}

function collectPanelIds(node: FlaxLayoutNode): readonly FlaxPanelId[] {
  if (node.type === "tabset") return node.panels;
  return node.children.flatMap((child) => collectPanelIds(child.node));
}

function findSplit(
  node: FlaxLayoutNode | null,
  splitId: FlaxNodeId,
): FlaxSplitNode | undefined {
  if (!node) return undefined;
  if (node.type === "split" && node.id === splitId) return node;
  if (node.type === "tabset") return undefined;
  for (const child of node.children) {
    const found = findSplit(child.node, splitId);
    if (found) return found;
  }
  return undefined;
}

function createDefaultDropLocation(root: FlaxLayoutNode): FlaxDropLocation | undefined {
  const firstTabset = findFirstTabset(root);
  const targetPanelId = firstTabset?.panels[0];
  return targetPanelId ? { targetPanelId, placement: "center" } : undefined;
}

function findFirstTabset(node: FlaxLayoutNode): FlaxTabsetNode | undefined {
  if (node.type === "tabset") return node;
  for (const child of node.children) {
    const found = findFirstTabset(child.node);
    if (found) return found;
  }
  return undefined;
}

function distributeSizes(children: readonly FlaxSplitChild[]): readonly FlaxSplitChild[] {
  const total = children.reduce((sum, child) => sum + Math.max(0, child.size), 0);
  if (total === 0) {
    const evenSize = 1 / children.length;
    return children.map((child) => ({ ...child, size: evenSize }));
  }
  return children.map((child) => ({ ...child, size: Math.max(0, child.size) / total }));
}

function visitLayout(
  node: FlaxLayoutNode | null,
  visitor: (node: FlaxLayoutNode) => void,
): void {
  if (!node) return;
  visitor(node);
  if (node.type === "split") {
    for (const child of node.children) visitLayout(child.node, visitor);
  }
}

function normalizeToolbars(
  toolbars: Partial<Record<FlaxToolbarCorner, readonly FlaxToolbarGroup[]>> | undefined,
  panelIds: readonly FlaxPanelId[],
): FlaxToolbarState {
  const assigned = new Set<FlaxPanelId>();
  const normalized = Object.fromEntries(
    flaxToolbarCorners.map((corner) => {
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
  ) as unknown as Record<FlaxToolbarCorner, readonly FlaxToolbarGroup[]>;

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
  toolbars: FlaxToolbarState,
  panelId: FlaxPanelId,
): FlaxToolbarState {
  if (getToolbarPanelIds({ root: null, panels: {}, hiddenPanelIds: [], toolbars }).includes(panelId)) {
    return toolbars;
  }
  return {
    ...toolbars,
    "top-left": appendPanelToToolbarGroups(toolbars["top-left"], panelId),
  };
}

function removeToolbarPanel(
  toolbars: FlaxToolbarState,
  panelId: FlaxPanelId,
): FlaxToolbarState {
  return Object.fromEntries(
    flaxToolbarCorners.map((corner) => [corner, removePanelFromToolbarGroups(toolbars[corner], panelId)]),
  ) as Record<FlaxToolbarCorner, readonly FlaxToolbarGroup[]>;
}

function movePanelInToolbars(
  toolbars: FlaxToolbarState,
  panelId: FlaxPanelId,
  location: FlaxToolbarItemLocation,
): FlaxToolbarState {
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
  groups: readonly FlaxToolbarGroup[],
  panelId: FlaxPanelId,
): readonly FlaxToolbarGroup[] {
  if (groups.length === 0) return [{ id: "main", panelIds: [panelId] }];
  const [first, ...rest] = groups;
  return [{ ...first!, panelIds: [...first!.panelIds, panelId] }, ...rest];
}

function removePanelFromToolbarGroups(
  groups: readonly FlaxToolbarGroup[],
  panelId: FlaxPanelId,
): readonly FlaxToolbarGroup[] {
  return groups
    .map((group) => ({
      ...group,
      panelIds: group.panelIds.filter((id) => id !== panelId),
    }))
    .filter((group) => group.panelIds.length > 0);
}

function insertPanelIntoToolbarGroups(
  groups: readonly FlaxToolbarGroup[],
  panelId: FlaxPanelId,
  location: FlaxToolbarItemLocation,
): readonly FlaxToolbarGroup[] {
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

function accept<TMeta>(state: FlaxLayoutState<TMeta>): FlaxLayoutAccepted<TMeta> {
  return { accepted: true, state };
}

function reject(reason: string): FlaxLayoutRejected {
  return { accepted: false, reason };
}

let nodeSequence = 0;

function createNodeId(prefix: string): FlaxNodeId {
  nodeSequence += 1;
  return `${prefix}-${nodeSequence}`;
}
