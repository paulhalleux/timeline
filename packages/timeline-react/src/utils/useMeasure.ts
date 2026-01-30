import React from "react";

/**
 * A React hook that measures the dimensions of a DOM element using ResizeObserver.
 * @returns A tuple containing:
 * 1. A ref callback to be assigned to the target element.
 * 2. A ref object pointing to the target element.
 * 3. An object with the current width and height of the element.
 * @template T - The type of the HTML element being measured.
 * @example
 * const [ref, elementRef, dimensions] = useMeasure<HTMLDivElement>();
 * return <div ref={ref}>Width: {dimensions.width}, Height: {dimensions.height}</div>;
 */
export function useMeasure<T extends HTMLElement>(): [
  React.RefCallback<T>,
  React.RefObject<T | null>,
  DOMRect | null,
] {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  const elementRef = React.useRef<T | null>(null);
  const previousObserver = React.useRef<ResizeObserver | null>(null);

  const customRef: React.RefCallback<T> = React.useCallback(
    (node: T | null) => {
      elementRef.current = node;

      if (previousObserver.current) {
        previousObserver.current.disconnect();
        previousObserver.current = null;
      }

      if (node?.nodeType === Node.ELEMENT_NODE) {
        const observer = new ResizeObserver(([entry]) => {
          if (entry && entry.borderBoxSize) {
            setRect(entry.contentRect);
          }
        });

        observer.observe(node);
        previousObserver.current = observer;
      }
    },
    [],
  );

  return [customRef, elementRef, rect];
}
