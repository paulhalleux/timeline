import React from "react";

import styles from "./Kbd.module.css";

export const Kbd = ({ children }: React.PropsWithChildren) => {
  return <kbd className={styles.kbd}>{children}</kbd>;
};
