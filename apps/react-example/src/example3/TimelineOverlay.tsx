import React from "react";

type TimelineOverlayProps = React.ComponentProps<"div">;

export const TimelineOverlay = ({ children, style }: TimelineOverlayProps) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 300,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
