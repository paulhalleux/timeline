import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import * as React from "react";

import { Kbd } from "../Kbd/Kbd.tsx";
import styles from "./Tooltip.module.css";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";
export type TooltipDelay = "none" | "short" | "normal" | "long";

const DELAY_VALUES: Record<TooltipDelay, { open: number; close: number }> = {
  none: { open: 0, close: 0 },
  short: { open: 100, close: 0 },
  normal: { open: 300, close: 0 },
  long: { open: 500, close: 0 },
};

export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Placement relative to trigger element */
  placement?: TooltipPlacement;
  /** Delay before showing tooltip */
  delay?: TooltipDelay;
  /** Whether tooltip is disabled */
  disabled?: boolean;
  /** Trigger element */
  children: React.ReactNode;
  /** Additional class name for tooltip */
  className?: string;
}

export const Tooltip = ({
  content,
  placement = "top",
  delay = "normal",
  disabled = false,
  children,
  className,
}: TooltipProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    delay: DELAY_VALUES[delay],
    move: false,
  });
  const role = useRole(context, { role: "tooltip" });
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    role,
    dismiss,
  ]);

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        style={{ display: "inline-flex" }}
      >
        {children}
      </span>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={`${styles.tooltip} ${className ?? ""}`}
            {...getFloatingProps()}
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

interface SimpleTooltipProps {
  label: string;
  placement?: TooltipPlacement;
  children: React.ReactNode;
}

const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  label,
  placement = "top",
  children,
}) => {
  return (
    <Tooltip content={label} placement={placement} delay="short">
      {children}
    </Tooltip>
  );
};

interface KbdTooltipProps {
  label: string;
  shortcut: string;
  placement?: TooltipPlacement;
  children: React.ReactNode;
}

const KbdTooltip: React.FC<KbdTooltipProps> = ({
  label,
  shortcut,
  placement = "top",
  children,
}) => {
  return (
    <Tooltip
      content={
        <div className={styles.kbd}>
          <span>{label}</span>
          <Kbd>{shortcut}</Kbd>
        </div>
      }
      placement={placement}
      delay="short"
    >
      {children}
    </Tooltip>
  );
};

Tooltip.Simple = SimpleTooltip;
Tooltip.Kbd = KbdTooltip;
