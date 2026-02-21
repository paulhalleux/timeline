import { Playhead as BasePlayhead } from "@ptl/timeline-react";

export const Playhead = () => {
  return (
    <BasePlayhead.Root>
      <BasePlayhead.Head className="-left-1.5 w-3.5 h-2.5 bg-white [clip-path:polygon(0_0,100%_0,50%_100%)]" />
      <BasePlayhead.Bar className="bg-white" />
      <BasePlayhead.Handle />
    </BasePlayhead.Root>
  );
};
