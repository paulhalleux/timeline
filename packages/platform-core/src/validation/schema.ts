export interface StandardSchemaIssue {
  readonly message: string;
  readonly path?: readonly (string | number | symbol)[];
}

export type StandardSchemaResult<TOutput> =
  | { readonly value: TOutput; readonly issues?: undefined }
  | { readonly issues: readonly StandardSchemaIssue[] };

export interface StandardSchemaLike<TInput = unknown, TOutput = TInput> {
  readonly "~standard": {
    validate(value: TInput): StandardSchemaResult<TOutput> | Promise<StandardSchemaResult<TOutput>>;
  };
}

export type InferSchemaOutput<TSchema> = TSchema extends StandardSchemaLike<unknown, infer TOutput>
  ? TOutput
  : never;

export async function validateSchema<TSchema extends StandardSchemaLike<unknown, unknown>>(
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
