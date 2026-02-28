import React from "react";

interface ZoomPercentWidgetProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

export const ZoomPercentWidget: React.FC<ZoomPercentWidgetProps> = ({
  value,
  min,
  max,
  step = 0.01,
  onChange,
}) => {
  const [dragging, setDragging] = React.useState(false);
  const startX = React.useRef(0);
  const startValue = React.useRef(value);
  const spanRef = React.useRef<HTMLSpanElement>(null);

  const safeMin = Math.max(1, min);
  const safeMax = Math.max(safeMin, max);

  React.useEffect(() => {
    if (!dragging) return;
    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - startX.current;
      let newValue = startValue.current + dx / 10;
      newValue = Math.round(newValue / step) * step;
      newValue = Math.max(safeMin, Math.min(safeMax, newValue));
      if (newValue !== value) onChange(newValue);
    };
    const handlePointerUp = () => {
      setDragging(false);
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.userSelect = "";
    };
  }, [dragging, safeMin, safeMax, step, onChange, value]);

  return (
    <span
      ref={spanRef}
      className="tabular-nums min-w-10 text-center select-none cursor-ew-resize text-neutral-400 text-xs"
      title="Drag to adjust zoom"
      onPointerDown={(e) => {
        setDragging(true);
        startX.current = e.clientX;
        startValue.current = value;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={safeMin}
      aria-valuemax={safeMax}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onChange(Math.max(safeMin, value - step));
        if (e.key === "ArrowRight")
          onChange(Math.max(safeMin, Math.min(safeMax, value + step)));
      }}
    >
      {value}%
    </span>
  );
};
