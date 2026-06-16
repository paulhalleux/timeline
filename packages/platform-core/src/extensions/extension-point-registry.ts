import { disposable, type Disposable } from "../lifecycle/disposable";
import { PlatformError, platformErrorCodes } from "../errors/platform-error";
import type { ContributionOwner, OwnedContribution } from "../contributions/owner";
import type { StandardSchemaLike } from "../validation/schema";
import { validateSchema } from "../validation/schema";

/**
 * Defines a typed contribution slot that domain packages can extend.
 *
 * @example
 * ```ts
 * const qcRules = defineExtensionPoint<QcRule>({ id: "subtitle.qc.rules" });
 * registry.define(qcRules);
 * await registry.contribute(qcRules, maxCpsRule, { pluginId: "subtitle.qc" });
 * ```
 */
export interface ExtensionPointDefinition<TContribution> {
  id: string;
  schema?: StandardSchemaLike<unknown, TContribution>;
}

export function defineExtensionPoint<TContribution>(
  definition: ExtensionPointDefinition<TContribution>,
): ExtensionPointDefinition<TContribution> {
  return definition;
}

export class ExtensionPointRegistry {
  private readonly definitions = new Map<string, ExtensionPointDefinition<any>>();
  private readonly contributions = new Map<string, OwnedContribution<any>[]>();

  define<TContribution>(extensionPoint: ExtensionPointDefinition<TContribution>): Disposable {
    if (this.definitions.has(extensionPoint.id)) {
      throw new PlatformError({
        code: platformErrorCodes.extensionPointAlreadyDefined,
        message: `Extension point "${extensionPoint.id}" is already defined`,
        details: { extensionPointId: extensionPoint.id },
      });
    }

    this.definitions.set(extensionPoint.id, extensionPoint);

    return disposable(() => {
      if (this.definitions.get(extensionPoint.id) === extensionPoint) {
        this.definitions.delete(extensionPoint.id);
        this.contributions.delete(extensionPoint.id);
      }
    });
  }

  has(extensionPointId: string): boolean {
    return this.definitions.has(extensionPointId);
  }

  getAll(): ExtensionPointDefinition<any>[] {
    return [...this.definitions.values()];
  }

  async contribute<TContribution>(
    extensionPoint: ExtensionPointDefinition<TContribution>,
    contribution: TContribution,
    owner?: ContributionOwner,
  ): Promise<Disposable> {
    const definition = this.definitions.get(extensionPoint.id);
    if (!definition) {
      throw new PlatformError({
        code: platformErrorCodes.extensionPointMissing,
        message: `Extension point "${extensionPoint.id}" is not defined`,
        details: { extensionPointId: extensionPoint.id },
      });
    }

    const validatedContribution = definition.schema
      ? await validateSchema(definition.schema, contribution)
      : contribution;
    const contributions = this.contributions.get(extensionPoint.id) ?? [];
    const entry: OwnedContribution<TContribution> = {
      contribution: validatedContribution,
      owner,
    };

    contributions.push(entry);
    this.contributions.set(extensionPoint.id, contributions);

    return disposable(() => {
      const current = this.contributions.get(extensionPoint.id);
      if (!current) {
        return;
      }

      const index = current.indexOf(entry);
      if (index !== -1) {
        current.splice(index, 1);
      }
    });
  }

  getContributions<TContribution>(
    extensionPoint: ExtensionPointDefinition<TContribution>,
  ): OwnedContribution<TContribution>[] {
    return [...(this.contributions.get(extensionPoint.id) ?? [])];
  }
}
