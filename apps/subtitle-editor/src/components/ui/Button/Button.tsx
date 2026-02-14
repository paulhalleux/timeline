import * as React from "react";

import styles from "./Button.module.css";

/* ============================================================================
 * Button Variants & Sizes
 * ========================================================================== */

export type ButtonVariant = "default" | "ghost" | "primary" | "icon";
export type ButtonSize = "sm" | "md" | "lg";

/* ============================================================================
 * Button Component
 * ========================================================================== */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether the button is in an active/pressed state */
  active?: boolean;
  /** Icon to display before children */
  iconStart?: React.ReactNode;
  /** Icon to display after children */
  iconEnd?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      active = false,
      iconStart,
      iconEnd,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const classNames = [
      styles.button,
      styles[`variant-${variant}`],
      styles[`size-${size}`],
      active ? styles.active : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={classNames} data-active={active} {...props}>
        {iconStart && <span className={styles.icon}>{iconStart}</span>}
        {children && <span className={styles.label}>{children}</span>}
        {iconEnd && <span className={styles.icon}>{iconEnd}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
