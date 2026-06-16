import {
  PlatformError,
  disposable,
  type Disposable,
  type LocalizedText,
  type StandardSchemaLike,
  validateSchema,
} from "@ptl/platform-core";

import type { WorkspaceItemState } from "../layout-state";
import { dockErrorCodes } from "../errors";

export interface WorkspaceItemTypeContribution<TInput = unknown, TMeta = unknown> {
  type: string;
  title: LocalizedText;
  component: string;
  inputSchema?: StandardSchemaLike<unknown, TInput>;
  metaSchema?: StandardSchemaLike<unknown, TMeta>;
  createItem(input: TInput): WorkspaceItemState<TMeta>;
}

type AnyWorkspaceItemTypeContribution = WorkspaceItemTypeContribution<unknown, unknown>;

/**
 * Registry for long-lived workspace item types such as editors or dashboards.
 *
 * The registry stores component IDs rather than React component types. React
 * resolution belongs to `platform-react` or a host app component registry.
 *
 * @example
 * ```ts
 * const registry = new WorkspaceItemTypeRegistry();
 * registry.register({
 *   type: "text-editor",
 *   title: "Text editor",
 *   component: "dock.editor.text",
 *   createItem: input => ({ id: String(input), type: "text-editor", title: "Editor", component: "dock.editor.text" }),
 * });
 * ```
 */
export class WorkspaceItemTypeRegistry {
  private readonly itemTypes = new Map<string, AnyWorkspaceItemTypeContribution>();

  register<TInput, TMeta>(contribution: WorkspaceItemTypeContribution<TInput, TMeta>): Disposable {
    if (this.itemTypes.has(contribution.type)) {
      throw new PlatformError({
        code: dockErrorCodes.itemTypeAlreadyRegistered,
        message: `Workspace item type "${contribution.type}" is already registered`,
        details: { type: contribution.type },
      });
    }

    this.itemTypes.set(contribution.type, contribution as AnyWorkspaceItemTypeContribution);

    return disposable(() => {
      if (this.itemTypes.get(contribution.type) === contribution) {
        this.itemTypes.delete(contribution.type);
      }
    });
  }

  get(type: string): AnyWorkspaceItemTypeContribution | undefined {
    return this.itemTypes.get(type);
  }

  getAll(): AnyWorkspaceItemTypeContribution[] {
    return [...this.itemTypes.values()];
  }

  /**
   * Create a workspace item from a registered type contribution.
   *
   * @example
   * ```ts
   * const item = await registry.createItem("text-editor", { uri: "file:///notes.vtt" });
   * ```
   */
  async createItem(type: string, input: unknown): Promise<WorkspaceItemState> {
    const contribution = this.itemTypes.get(type);

    if (!contribution) {
      throw new PlatformError({
        code: dockErrorCodes.itemTypeMissing,
        message: `Workspace item type "${type}" is not registered`,
        details: { type },
      });
    }

    const validatedInput = contribution.inputSchema
      ? await validateSchema(contribution.inputSchema, input)
      : input;
    const item = contribution.createItem(validatedInput);
    const validatedMetadata =
      contribution.metaSchema && item.metadata !== undefined
        ? await validateSchema(contribution.metaSchema, item.metadata)
        : item.metadata;

    return {
      ...item,
      component: item.component || contribution.component,
      metadata: validatedMetadata,
      type: contribution.type,
    };
  }
}
