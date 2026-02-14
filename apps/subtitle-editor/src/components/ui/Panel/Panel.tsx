import React from "react";
import * as ResizablePanels from "react-resizable-panels";

import styles from "./Panel.module.css";
interface PanelProps extends React.PropsWithChildren {
  minSize?: number;
  maxSize?: number;
  defaultSize?: number;
  disabled?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  minSize = 50,
  maxSize = Infinity,
  defaultSize = 200,
  disabled = false,
}) => {
  return (
    <ResizablePanels.Panel
      minSize={minSize}
      maxSize={maxSize}
      defaultSize={defaultSize}
      disabled={disabled}
      className={styles.panel}
    >
      {children}
    </ResizablePanels.Panel>
  );
};
