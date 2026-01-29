import type React from "react";

/**
 * Determines whether a horizontal mouse event should be applied based on its position
 * @param event - The mouse or pointer event to evaluate
 * @returns A boolean indicating whether the event should be applied
 */
export const shouldApplyHorizontalMouseEvent = (
  event: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>,
) => {
  const targetRect = event.currentTarget.getBoundingClientRect();
  if (event.movementX > 0 && event.clientX < targetRect.left) {
    return false;
  }
  return !(event.movementX < 0 && event.clientX > targetRect.right);
};
