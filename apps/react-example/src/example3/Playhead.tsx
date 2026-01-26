import { usePlayhead } from "@ptl/timeline-react";

export const Playhead = () => {
  const position = usePlayhead();

  return (
    <div
      ref={position.module.getPlayhead()?.connect}
      style={{
        position: "absolute",
        left: position.leftPx,
        top: 0,
        height: "100%",
        width: 2,
        backgroundColor: "red",
        pointerEvents: "auto",
        cursor: "pointer",
        zIndex: 205,
      }}
    />
  );
};
