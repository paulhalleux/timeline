import React from "react";

type PanWidgetProps = {
  onPan: (delta: number) => void;
  sensitivity?: number;
};

export function PanWidget({ sensitivity = 0.1, onPan }: PanWidgetProps) {
  const rafId = React.useRef<number | null>(null);
  const [lastDelta, setLastDelta] = React.useState(0);

  React.useEffect(() => {
    const abortController = new AbortController();
    const onMouseUp = () => {
      animateNumber(
        lastDelta,
        0,
        (value) => {
          setLastDelta(value);
          if (value === 0 && rafId.current !== null) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
          }
        },
        200,
      );
    };

    window.addEventListener("pointerup", onMouseUp, {
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
    };
  }, [lastDelta]);

  React.useEffect(() => {
    if (lastDelta === 0) return;

    const step = () => {
      onPan(lastDelta * sensitivity);
      rafId.current = requestAnimationFrame(step);
    };

    rafId.current = requestAnimationFrame(step);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [lastDelta, onPan, sensitivity]);

  return (
    <input
      type="range"
      min={-1}
      max={1}
      step={0.01}
      value={lastDelta}
      style={{ width: 500 }}
      onChange={(e) => {
        const value = parseFloat(e.target.value);
        setLastDelta(value);
      }}
    />
  );
}

const animateNumber = (
  from: number,
  to: number,
  callback: (value: number) => void,
  duration = 300,
) => {
  const startTime = performance.now();

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = from + (to - from) * progress;
    callback(value);
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};
