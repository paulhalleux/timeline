import React from "react";

import styles from "./Panel.module.css";

type PanelTitleProps = React.PropsWithChildren;

export const PanelTitle = ({ children }: PanelTitleProps) => {
  return <div className={styles.headerTitle}>{children}</div>;
};
