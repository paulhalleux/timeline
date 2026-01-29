import { usePlayhead, useTimelineTranslate } from "@ptl/timeline-react";

export const Playhead = () => {
  const position = usePlayhead();
  const translatePx = useTimelineTranslate();
  return (
    <div
      style={{
        position: "absolute",
        left: position.leftPx - translatePx,
        top: 0,
        height: "100%",
        width: 2,
        backgroundColor: "red",
        pointerEvents: "auto",
        cursor: "pointer",
        zIndex: 205,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -7,
          width: 15,
          height: 10,
          backgroundColor: "red",
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
        }}
      />
    </div>
  );
};
