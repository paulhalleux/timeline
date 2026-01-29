import React from "react";

type PlayheadContextType = {
  position: number;
  playing: boolean;
};

const PlayheadContext = React.createContext<PlayheadContextType | null>(null);

export const PlayheadProvider = ({
  position,
  playing,
  children,
}: React.PropsWithChildren<PlayheadContextType>) => {
  return (
    <PlayheadContext.Provider
      value={React.useMemo(() => ({ position, playing }), [position, playing])}
    >
      {children}
    </PlayheadContext.Provider>
  );
};

export const usePlayheadContext = () => {
  const context = React.useContext(PlayheadContext);
  if (!context) {
    throw new Error(
      "usePlayheadContext must be used within a PlayheadProvider",
    );
  }
  return context;
};
