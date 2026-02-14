import React from "react";

import styles from "./Field.module.css";

export type FieldProps = React.PropsWithChildren<{
  label: string;
  description?: React.ReactNode;
}>;

export const Field: React.FC<FieldProps> = ({
  label,
  description,
  children,
}) => {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      <div className={styles.fieldDescription}>{description}</div>
    </div>
  );
};
