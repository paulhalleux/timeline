import React from "react";

import styles from "./Panel.module.css";

type PanelHeaderProps = React.PropsWithChildren;

export const PanelHeader = ({ children }: PanelHeaderProps) => {
  return <div className={styles.header}>{children}</div>;
};
