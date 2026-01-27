import React from "react";

export function useMeasure<T extends HTMLElement>(): [
  React.RefCallback<T>,
  React.RefObject<T | null>,
  { width: number | null; height: number | null },
] {
  const [dimensions, setDimensions] = React.useState<{
    width: number | null;
    height: number | null;
  }>({
    width: null,
    height: null,
  });

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
            const { inlineSize: width, blockSize: height } =
              entry.borderBoxSize[0]!;

            setDimensions({ width, height });
          }
        });

        observer.observe(node);
        previousObserver.current = observer;
      }
    },
    [],
  );

  return [customRef, elementRef, dimensions];
}
