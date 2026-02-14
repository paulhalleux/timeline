import * as React from "react";

import styles from "./VerticalToolbar.module.css";

// ============================================================================
// Types
// ============================================================================

export interface ToolbarItem {
  /** Unique identifier for the item */
  id: string;
  /** Icon to display */
  icon: React.ReactNode;
  /** Tooltip/title text */
  label: string;
  /** Optional badge count */
  badge?: number;
  /** Whether item is disabled */
  disabled?: boolean;
}

export interface VerticalToolbarProps {
  /** List of toolbar items */
  items: ToolbarItem[];
  /** Currently active item ID */
  activeId: string | null;
  /** Called when an item is clicked */
  onItemClick: (id: string) => void;
  /** Optional bottom items (settings, etc.) */
  bottomItems?: ToolbarItem[];
  /** Additional class name */
  className?: string;
}

// ============================================================================
// ToolbarButton
// ============================================================================

interface ToolbarButtonProps {
  item: ToolbarItem;
  isActive: boolean;
  onClick: () => void;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  item,
  isActive,
  onClick,
}) => {
  return (
    <div className={styles.toolbarItemWrapper}>
      <button
        className={styles.toolbarItem}
        data-active={isActive}
        onClick={onClick}
        disabled={item.disabled}
        aria-label={item.label}
        aria-pressed={isActive}
      >
        {item.icon}
      </button>
      {item.badge !== undefined && item.badge > 0 && (
        <span className={styles.badge}>
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
      <span className={styles.tooltip}>{item.label}</span>
    </div>
  );
};

// ============================================================================
// Separator
// ============================================================================

export const ToolbarSeparator: React.FC = () => {
  return <div className={styles.separator} />;
};

// ============================================================================
// Spacer
// ============================================================================

export const ToolbarSpacer: React.FC = () => {
  return <div className={styles.spacer} />;
};

// ============================================================================
// VerticalToolbar
// ============================================================================

export const VerticalToolbar: React.FC<VerticalToolbarProps> = ({
  items,
  activeId,
  onItemClick,
  bottomItems,
  className,
}) => {
  return (
    <div className={`${styles.toolbar} ${className ?? ""}`}>
      {items.map((item) => (
        <ToolbarButton
          key={item.id}
          item={item}
          isActive={activeId === item.id}
          onClick={() => onItemClick(item.id)}
        />
      ))}

      {bottomItems && bottomItems.length > 0 && (
        <>
          <ToolbarSpacer />
          <ToolbarSeparator />
          {bottomItems.map((item) => (
            <ToolbarButton
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              onClick={() => onItemClick(item.id)}
            />
          ))}
        </>
      )}
    </div>
  );
};

// ============================================================================
// Compound Export
// ============================================================================

export const Toolbar = {
  Root: VerticalToolbar,
  Separator: ToolbarSeparator,
  Spacer: ToolbarSpacer,
};
