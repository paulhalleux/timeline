export type WhenPredicate<TContext> = (context: TContext) => boolean;

export interface ContributionStatePredicate<TContext> {
  visible?: WhenPredicate<TContext>;
  enabled?: WhenPredicate<TContext>;
}

export function isContributionVisible<TContext>(
  predicate: ContributionStatePredicate<TContext> | undefined,
  context: TContext,
): boolean {
  return predicate?.visible?.(context) ?? true;
}

export function isContributionEnabled<TContext>(
  predicate: ContributionStatePredicate<TContext> | undefined,
  context: TContext,
): boolean {
  return predicate?.enabled?.(context) ?? true;
}
