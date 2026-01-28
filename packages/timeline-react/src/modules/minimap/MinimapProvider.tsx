import React from "react";

export type MinimapContextType = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  containerSize: { width: number | null; height: number | null };
};

export const MinimapContext = React.createContext<MinimapContextType | null>(
  null,
);

export const useMinimapContext = () => {
  const context = React.useContext(MinimapContext);
  if (!context) {
    throw new Error(
      "Minimap components must be used within a Minimap.Root component",
    );
  }
  return context;
};
