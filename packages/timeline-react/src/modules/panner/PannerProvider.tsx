import React from "react";

export type PannerContextType = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  containerRect: DOMRect | null;
  delta: number;
  setDelta: (delta: number) => void;
};

export const PannerContext = React.createContext<PannerContextType | null>(
  null,
);

export const usePannerContext = () => {
  const context = React.useContext(PannerContext);
  if (!context) {
    throw new Error(
      "Panner components must be used within a Panner.Root component",
    );
  }
  return context;
};
