import { cn } from "@ptl/ui";
import { Separator as PanelResizeHandle } from "react-resizable-panels";

export interface DockResizeHandleProps {
  /** Stable panel-resize handle id used by `react-resizable-panels`. */
  id: string;
  /** Visual axis of the separator. Horizontal handles resize vertical stacks. */
  orientation?: "horizontal" | "vertical";
}

/**
 * Thin resize separator shared by dock regions and placement stacks.
 *
 * @example
 * ```tsx
 * <DockResizeHandle id="dock-left-resize" />
 * <DockResizeHandle id="dock-bottom-resize" orientation="horizontal" />
 * ```
 */
export function DockResizeHandle({
  id,
  orientation = "vertical",
}: DockResizeHandleProps) {
  return (
    <PanelResizeHandle
      id={id}
      className={cn(
        "shrink-0 bg-border transition-colors hover:bg-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[resize-handle-state=drag]:bg-ring",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      )}
    />
  );
}
