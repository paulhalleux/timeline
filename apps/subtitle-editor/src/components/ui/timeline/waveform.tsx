import React from "react";

import { Waveform as BaseWaveform } from "@ptl/timeline-react";

import clsx from "clsx";

export const WaveformRoot = ({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof BaseWaveform.Root>) => {
  return (
    <BaseWaveform.Root
      className={clsx(
        "border-t border-neutral-800 bg-[#1c1c1c]",
        "z-20 mt-auto",
        className,
      )}
      style={{
        height: 64,
        ...rest.style,
      }}
      {...rest}
    >
      {children}
    </BaseWaveform.Root>
  );
};

export const WaveformHeader = ({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof BaseWaveform.Header>) => {
  return (
    <BaseWaveform.Header
      className={clsx(
        "h-full border-r shrink-0 border-neutral-800 bg-[#1c1c1c]",
        className,
      )}
      {...rest}
    >
      {children}
    </BaseWaveform.Header>
  );
};

export const WaveformCanvas = ({
  className,
  ...rest
}: React.ComponentProps<typeof BaseWaveform.Canvas>) => {
  return <BaseWaveform.Canvas className={clsx(className)} {...rest} />;
};
