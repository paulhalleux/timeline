import type { ServiceToken } from "../services/tokens";
import type { LocalizedText } from "../text/messages";
import type { StandardSchemaLike } from "../validation/schema";
import type { CommandDefinition as LegacyCommandDefinition } from "./command-registry";

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

export interface CommandDefinition<TInput = void, TResult = void>
  extends LegacyCommandDefinition<TInput, TResult> {
  readonly handler?: (
    context: CommandHandlerContext<TInput>,
  ) => TResult | Promise<TResult>;
}

export interface CommandOptions<TInput, TResult> {
  readonly id: string;
  readonly title: LocalizedText;
  readonly description?: LocalizedText;
  readonly category?: LocalizedText;
  readonly keywords?: readonly string[];
  readonly palette?: boolean;
  readonly input?: StandardSchemaLike<unknown, TInput>;
  readonly result?: StandardSchemaLike<unknown, TResult>;
  readonly handler?: (
    context: CommandHandlerContext<TInput>,
  ) => TResult | Promise<TResult>;
}

export function createCommand<TInput = void, TResult = void>(
  definition: CommandOptions<TInput, TResult>,
): CommandDefinition<TInput, TResult> {
  return definition;
}
