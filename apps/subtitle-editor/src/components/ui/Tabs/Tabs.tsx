import * as React from "react";
import styles from "./Tabs.module.css";
import { XIcon } from "lucide-react";

/* ============================================================================
 * Tab Context
 * ========================================================================== */

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tab components must be used within a Tabs.Root");
  }
  return context;
};

/* ============================================================================
 * Tabs.Root
 * ========================================================================== */

interface TabsRootProps {
  /** The default active tab ID */
  defaultValue?: string;
  /** Controlled active tab ID */
  value?: string;
  /** Callback when active tab changes */
  onValueChange?: (value: string) => void;
  /** Children */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

const TabsRoot: React.FC<TabsRootProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");

  const activeTab = value ?? internalValue;
  const setActiveTab = React.useCallback(
    (id: string) => {
      if (value === undefined) {
        setInternalValue(id);
      }
      onValueChange?.(id);
    },
    [value, onValueChange],
  );

  const contextValue = React.useMemo(
    () => ({ activeTab, setActiveTab }),
    [activeTab, setActiveTab],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={`${styles.root} ${className ?? ""}`}>{children}</div>
    </TabsContext.Provider>
  );
};

/* ============================================================================
 * Tabs.List
 * ========================================================================== */

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div className={`${styles.list} ${className ?? ""}`} role="tablist">
      {children}
    </div>
  );
};

/* ============================================================================
 * Tabs.Tab
 * ========================================================================== */

interface TabsTriggerProps {
  /** Unique identifier for this tab */
  value: string;
  /** Tab label content */
  children: React.ReactNode;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Close button click handler */
  onClose?: () => void;
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  icon,
  disabled,
  className,
  onClose,
}) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      data-state={isActive ? "active" : "inactive"}
      className={`${styles.trigger} ${isActive ? styles.triggerActive : ""} ${className ?? ""}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {icon && <span className={styles.triggerIcon}>{icon}</span>}
      <span className={styles.triggerLabel}>{children}</span>
      {onClose && (
        <span
          className={styles.triggerClose}
          onClick={handleClose}
          role="button"
          aria-label="Close tab"
        >
          <XIcon size={14} />
        </span>
      )}
    </button>
  );
};

/* ============================================================================
 * Tabs.Content
 * ========================================================================== */

interface TabsContentProps {
  /** The tab value this content belongs to */
  value: string;
  /** Content to display when tab is active */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
}) => {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      data-state="active"
      className={`${styles.content} ${className ?? ""}`}
    >
      {children}
    </div>
  );
};

/* ============================================================================
 * Export
 * ========================================================================== */

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};

export { useTabsContext };
