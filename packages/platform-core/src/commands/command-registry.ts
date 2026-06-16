import { disposable, type Disposable } from "../lifecycle/disposable";
import { PlatformError, platformErrorCodes } from "../errors/platform-error";
import type { StandardSchemaLike } from "../validation/schema";
import { validateSchema } from "../validation/schema";
import type { LocalizedText } from "../text/messages";
import { TypedEventEmitter } from "../events/typed-event-emitter";

export interface CommandExecutionContext {
  signal: AbortSignal;
}

/**
 * A command is the platform's canonical executable unit.
 *
 * Command definitions are intentionally static: they can be contributed by a
 * plugin before that plugin is activated, which lets palettes, menus, and
 * shortcut adapters discover available behavior without eagerly loading every
 * handler.
 *
 * @example
 * ```ts
 * const exportCommand = defineCommand<{ format: string }, void>({
 *   id: "export.run",
 *   title: "Export subtitles",
 *   input: exportInputSchema,
 * });
 * ```
 */
export interface CommandDefinition<TInput = void, TResult = void> {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  category?: LocalizedText;
  keywords?: readonly string[];
  palette?: boolean;
  input?: StandardSchemaLike<unknown, TInput>;
  result?: StandardSchemaLike<unknown, TResult>;
}

export type CommandInput<TCommand> =
  TCommand extends CommandDefinition<infer TInput, any> ? TInput : never;

export type CommandResult<TCommand> =
  TCommand extends CommandDefinition<any, infer TResult> ? TResult : never;

export type CommandHandler<TCommand extends CommandDefinition<any, any>> = (
  input: CommandInput<TCommand>,
  context: CommandExecutionContext,
) => CommandResult<TCommand> | Promise<CommandResult<TCommand>>;

export interface CommandRegistryEvents {
  changed: {
    commandId: string;
    reason: "registered" | "unregistered" | "handler-registered" | "handler-unregistered";
  };
}

export function defineCommand<TInput = void, TResult = void>(
  definition: CommandDefinition<TInput, TResult>,
): CommandDefinition<TInput, TResult> {
  return definition;
}

/**
 * Stores command metadata separately from executable handlers.
 *
 * This split is what makes lazy plugin activation possible: register the
 * command definition during composition, and register the handler only when the
 * owning plugin activates.
 */
export class CommandRegistry {
  private readonly commands = new Map<string, CommandDefinition<any, any>>();
  private readonly handlers = new Map<string, CommandHandler<any>>();
  private readonly events = new TypedEventEmitter<CommandRegistryEvents>();

  onDidChange(listener: (event: CommandRegistryEvents["changed"]) => void): Disposable {
    return this.events.on("changed", listener);
  }

  register<TCommand extends CommandDefinition<any, any>>(command: TCommand): Disposable {
    if (this.commands.has(command.id)) {
      throw new PlatformError({
        code: platformErrorCodes.commandAlreadyRegistered,
        message: `Command "${command.id}" is already registered`,
        details: { commandId: command.id },
      });
    }

    this.commands.set(command.id, command);
    this.events.emit("changed", { commandId: command.id, reason: "registered" });

    return disposable(() => {
      if (this.commands.get(command.id) === command) {
        this.commands.delete(command.id);
        this.handlers.delete(command.id);
        this.events.emit("changed", { commandId: command.id, reason: "unregistered" });
      }
    });
  }

  registerHandler<TCommand extends CommandDefinition<any, any>>(
    command: TCommand,
    handler: CommandHandler<TCommand>,
  ): Disposable {
    if (this.handlers.has(command.id)) {
      throw new PlatformError({
        code: platformErrorCodes.commandHandlerAlreadyRegistered,
        message: `Command "${command.id}" already has a handler`,
        details: { commandId: command.id },
      });
    }

    this.handlers.set(command.id, handler);
    this.events.emit("changed", { commandId: command.id, reason: "handler-registered" });

    return disposable(() => {
      if (this.handlers.get(command.id) === handler) {
        this.handlers.delete(command.id);
        this.events.emit("changed", { commandId: command.id, reason: "handler-unregistered" });
      }
    });
  }

  getAll(): CommandDefinition<any, any>[] {
    return [...this.commands.values()];
  }

  get(commandId: string): CommandDefinition<any, any> | undefined {
    return this.commands.get(commandId);
  }

  has(commandId: string): boolean {
    return this.commands.has(commandId);
  }

  async execute<TCommand extends CommandDefinition<any, any>>(
    command: TCommand,
    input: CommandInput<TCommand>,
    options: { signal?: AbortSignal } = {},
  ): Promise<CommandResult<TCommand>> {
    const handler = this.handlers.get(command.id);
    if (!handler) {
      throw new PlatformError({
        code: platformErrorCodes.commandHandlerMissing,
        message: `Command "${command.id}" does not have an active handler`,
        details: { commandId: command.id },
      });
    }

    const validatedInput = command.input ? await validateSchema(command.input, input) : input;
    const result = await handler(validatedInput, {
      signal: options.signal ?? new AbortController().signal,
    });

    return (
      command.result ? await validateSchema(command.result, result) : result
    ) as CommandResult<TCommand>;
  }
}
