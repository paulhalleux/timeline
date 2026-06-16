export interface ContributionOwner {
  pluginId?: string;
  label?: string;
}

export interface OwnedContribution<TContribution> {
  contribution: TContribution;
  owner?: ContributionOwner;
}
