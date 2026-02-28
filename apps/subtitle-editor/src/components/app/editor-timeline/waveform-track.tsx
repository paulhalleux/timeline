import { useWaveform } from "@ptl/timeline-react";

import { AudioWaveformIcon } from "lucide-react";

import { WaveformTrack } from "../../ui/timeline";

export const EditorWaveformTrack = () => {
  const [{ peaks }] = useWaveform();

  if (!peaks) return null;

  return (
    <WaveformTrack.Root>
      <WaveformTrack.Header className="h-full flex items-center gap-1.5 px-3 text-xs text-neutral-400">
        <AudioWaveformIcon size={14} className="text-neutral-500" />
        <span>Waveform</span>
      </WaveformTrack.Header>
      <WaveformTrack.Canvas height={64} color="rgba(6, 182, 212, 0.5)" />
    </WaveformTrack.Root>
  );
};
