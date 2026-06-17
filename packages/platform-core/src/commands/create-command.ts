import type { ServiceToken } from "../services/tokens";
import type { LocalizedText } from "../text/messages";
import type { StandardSchemaLike } from "../validation/schema";

export interface CommandHandlerContext<TInput> {
  readonly input: TInput;
  readonly signal: AbortSignal;
  get<T>(token: ServiceToken<T>): T;
  execute<TNextInput, TNextResult>(
    command: CommandDefinition<TNextInput, TNextResult>,
    input: TNextInput,
    options?: { readonly signal?: AbortSignal },
  ): Promise<TNextResult>;
}

export interface CommandDefinition<TInput = void, TResult = void> {
  readonly kind: "command";
  readonly id: string;
  readonly title: LocalizedText;
  readonly description?: LocalizedText;
  readonly category?: LocalizedText;
  readonly keywords?: readonly string[];
  readonly palette?: boolean;
  readonly input?: StandardSchemaLike<unknown, TInput>;
  readonly result?: StandardSchemaLike<unknown, TResult>;
  readonly handler?: (context: CommandHandlerContext<TInput>) => TResult | Promise<TResult>;
}

export type CommandInput<TCommand> = TCommand extends CommandDefinition<infer TInput, unknown>
  ? TInput
  : never;

export type CommandResult<TCommand> = TCommand extends CommandDefinition<unknown, infer TResult>
  ? TResult
  : never;

export function createCommand<TInput = void, TResult = void>(
  definition: Omit<CommandDefinition<TInput, TResult>, "kind">,
): CommandDefinition<TInput, TResult> {
  return { kind: "command", ...definition };
}
