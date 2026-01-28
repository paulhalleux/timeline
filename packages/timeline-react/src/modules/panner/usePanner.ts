import React from "react";
import { animateNumber } from "../../utils/animate-number.ts";

type UsePannerArgs = {
  onPan?: (delta: number) => void;
};

export const usePanner = ({ onPan }: UsePannerArgs) => {
  const rafId = React.useRef<number | null>(null);
  const [delta, setDelta] = React.useState(0);

  // Pointer up → ease delta back to 0
  React.useEffect(() => {
    if (delta === 0) return;

    const controller = new AbortController();

    const onPointerUp = () => {
      animateNumber(delta, 0, setDelta, 200);
    };

    window.addEventListener("pointerup", onPointerUp, {
      signal: controller.signal,
    });

    return () => controller.abort();
  }, [delta]);

  // Continuous pan loop
  React.useEffect(() => {
    if (delta === 0 || !onPan) return;

    const step = () => {
      onPan(delta);
      rafId.current = requestAnimationFrame(step);
    };

    rafId.current = requestAnimationFrame(step);

    return () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [delta, onPan]);

  return {
    delta,
    setDelta,
  };
};
