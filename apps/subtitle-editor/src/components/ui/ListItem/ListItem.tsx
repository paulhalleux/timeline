import * as React from "react";

import styles from "./ListItem.module.css";

// ============================================================================
// ListContainer
// ============================================================================

export interface ListContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ListContainer = React.forwardRef<
  HTMLDivElement,
  ListContainerProps
>(({ children, className }, ref) => {
  return (
    <div ref={ref} className={`${styles.listContainer} ${className ?? ""}`}>
      {children}
    </div>
  );
});

ListContainer.displayName = "ListContainer";

// ============================================================================
// ListItem
// ============================================================================

export interface ListItemProps {
  /** Whether the item is currently active (e.g., at playhead position) */
  isActive?: boolean;
  /** Whether the item is selected */
  isSelected?: boolean;
  /** Layout variant */
  variant?: "column" | "row";
  /** Click handler */
  onClick?: (e: React.MouseEvent) => void;
  /** Double-click handler */
  onDoubleClick?: (e: React.MouseEvent) => void;
  /** Children content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Ref for scrolling */
  itemRef?: React.Ref<HTMLButtonElement>;
}

export const ListItem: React.FC<ListItemProps> = ({
  isActive = false,
  isSelected = false,
  variant = "column",
  onClick,
  onDoubleClick,
  children,
  className,
  itemRef,
}) => {
  const classNames = [
    styles.listItem,
    variant === "row" ? styles.listItemRow : "",
    isActive ? styles.listItemActive : "",
    isSelected ? styles.listItemSelected : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={itemRef}
      className={classNames}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </button>
  );
};

// ============================================================================
// ListItemMeta - For time displays, badges, etc.
// ============================================================================

export interface ListItemMetaProps {
  children: React.ReactNode;
  className?: string;
}

export const ListItemMeta: React.FC<ListItemMetaProps> = ({
  children,
  className,
}) => {
  return (
    <span className={`${styles.listItemMeta} ${className ?? ""}`}>
      {children}
    </span>
  );
};

// ============================================================================
// ListItemText - Primary text content
// ============================================================================

export interface ListItemTextProps {
  children: React.ReactNode;
  className?: string;
}

export const ListItemText: React.FC<ListItemTextProps> = ({
  children,
  className,
}) => {
  return (
    <span className={`${styles.listItemText} ${className ?? ""}`}>
      {children}
    </span>
  );
};

// ============================================================================
// ListItemSecondary - Secondary/muted text
// ============================================================================

export interface ListItemSecondaryProps {
  children: React.ReactNode;
  className?: string;
}

export const ListItemSecondary: React.FC<ListItemSecondaryProps> = ({
  children,
  className,
}) => {
  return (
    <span className={`${styles.listItemSecondary} ${className ?? ""}`}>
      {children}
    </span>
  );
};

// ============================================================================
// ListItemIcon - Icon slot
// ============================================================================

export interface ListItemIconProps {
  children: React.ReactNode;
  className?: string;
}

export const ListItemIcon: React.FC<ListItemIconProps> = ({
  children,
  className,
}) => {
  return (
    <span className={`${styles.listItemIcon} ${className ?? ""}`}>
      {children}
    </span>
  );
};

// ============================================================================
// Compound Export
// ============================================================================

export const List = {
  Container: ListContainer,
  Item: ListItem,
  Meta: ListItemMeta,
  Text: ListItemText,
  Secondary: ListItemSecondary,
  Icon: ListItemIcon,
};
