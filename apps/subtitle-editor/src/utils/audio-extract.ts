/**
 * Extracts normalized peak amplitudes from an audio/video File using the Web Audio API.
 *
 * @param file - The audio or video file to extract peaks from.
 * @param samplesPerSecond - Number of peak samples per second of audio (controls resolution). Default 100.
 * @returns An object containing the peaks (Float32Array of 0..1 values) and duration in milliseconds.
 */
export async function extractAudioPeaks(
  file: File,
  samplesPerSecond = 100,
): Promise<{ peaks: Float32Array; durationMs: number }> {
  const arrayBuffer = await file.arrayBuffer();

  const audioContext = new AudioContext();
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const durationMs = audioBuffer.duration * 1000;
    const totalSamples = Math.ceil(audioBuffer.duration * samplesPerSecond);

    // Merge all channels into a single peaks array
    const channelCount = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samplesPerPeak = Math.floor(sampleRate / samplesPerSecond);

    const peaks = new Float32Array(totalSamples);

    for (let ch = 0; ch < channelCount; ch++) {
      const channelData = audioBuffer.getChannelData(ch);

      for (let i = 0; i < totalSamples; i++) {
        const start = i * samplesPerPeak;
        const end = Math.min(start + samplesPerPeak, channelData.length);

        let max = 0;
        for (let s = start; s < end; s++) {
          const val = Math.abs(channelData[s]);
          if (val > max) max = val;
        }

        // Take the max across channels
        if (max > peaks[i]) {
          peaks[i] = max;
        }
      }
    }

    return { peaks, durationMs };
  } finally {
    await audioContext.close();
  }
}
