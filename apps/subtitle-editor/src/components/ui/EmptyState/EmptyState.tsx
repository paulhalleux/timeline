import * as React from "react";

import styles from "./EmptyState.module.css";

/* ============================================================================
 * EmptyState Component
 * ========================================================================= */

export interface EmptyStateProps {
  /** Icon to display in the empty state */
  icon: React.ReactNode;
  /** Title text for the empty state */
  title: string;
  /** Optional description text for the empty state */
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className={styles.emptyState}>
      <div className={styles.icon}>{icon}</div>
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
};
