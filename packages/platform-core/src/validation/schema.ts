import type { StandardSchemaV1 } from "@standard-schema/spec";

export type StandardSchemaLike<TInput = unknown, TOutput = TInput> = StandardSchemaV1<
  TInput,
  TOutput
>;

export type StandardSchemaResult<TOutput> = StandardSchemaV1.Result<TOutput>;

export type StandardSchemaIssue = StandardSchemaV1.Issue;

export type InferSchemaOutput<TSchema> =
  TSchema extends StandardSchemaLike<any, any> ? StandardSchemaV1.InferOutput<TSchema> : never;

export async function validateSchema<TSchema extends StandardSchemaLike<any, any>>(
  schema: TSchema,
  value: unknown,
): Promise<InferSchemaOutput<TSchema>> {
  const result = await schema["~standard"].validate(value);

  if ("issues" in result && result.issues) {
    throw new SchemaValidationError(result.issues);
  }

  return result.value as InferSchemaOutput<TSchema>;
}

export class SchemaValidationError extends Error {
  readonly issues: readonly StandardSchemaIssue[];

  constructor(issues: readonly StandardSchemaIssue[]) {
    super(`Schema validation failed: ${issues.map((issue) => issue.message).join("; ")}`);
    this.name = "SchemaValidationError";
    this.issues = issues;
  }
}
