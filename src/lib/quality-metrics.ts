/** Per-clip audio quality metrics computed client-side from decoded PCM data. */

export interface QualityMetrics {
  /** Peak amplitude in dBFS (0 = full scale; negative = quieter). */
  peakDbfs: number;
  /** RMS amplitude in dBFS. */
  rmsDbfs: number;
  /** True if any sample exceeds ±0.99 (clipping). */
  clipping: boolean;
  /** Fraction of samples whose absolute value is below the silence threshold. */
  silenceRatio: number;
  /**
   * Simple SNR estimate in dB: RMS of signal windows vs RMS of silent windows.
   * Returns 0 when there are no signal windows or no noise windows.
   */
  snrEstimate: number;
  /** True when clipping, silenceRatio > 0.8, or peakDbfs < -40. */
  lowQuality: boolean;
}

/**
 * Divide PCM data into 10 ms windows (480 samples @ 48 kHz) and separate
 * them into "signal" and "noise" buckets by comparing window RMS to threshold.
 * Returns an SNR estimate in dB, or 0 when buckets are insufficient.
 */
function computeSnrEstimate(data: Float32Array, threshold: number): number {
  const windowSize = 480;
  const signalRmsList: number[] = [];
  const noiseRmsList: number[] = [];

  for (let i = 0; i + windowSize <= data.length; i += windowSize) {
    let sumSq = 0;
    for (let j = i; j < i + windowSize; j++) sumSq += data[j] * data[j];
    const windowRms = Math.sqrt(sumSq / windowSize);
    if (windowRms > threshold) signalRmsList.push(windowRms);
    else noiseRmsList.push(windowRms);
  }

  if (signalRmsList.length === 0 || noiseRmsList.length === 0) return 0;

  const signalRms = Math.sqrt(
    signalRmsList.reduce((s, v) => s + v * v, 0) / signalRmsList.length,
  );
  const noiseRms = Math.sqrt(
    noiseRmsList.reduce((s, v) => s + v * v, 0) / noiseRmsList.length,
  );

  return noiseRms > 0 ? 20 * Math.log10(signalRms / noiseRms) : 40;
}

/**
 * Compute quality metrics from a decoded AudioBuffer.
 * Only the first channel is analysed (mono or L of stereo).
 */
export function computeQualityMetrics(buffer: AudioBuffer): QualityMetrics {
  const data = buffer.getChannelData(0);
  const silenceThreshold = 0.01;

  let peakAbs = 0;
  let sumSq = 0;
  let silentSamples = 0;
  let clipping = false;

  for (let i = 0; i < data.length; i++) {
    const abs = Math.abs(data[i]);
    if (abs > peakAbs) peakAbs = abs;
    sumSq += data[i] * data[i];
    if (abs > 0.99) clipping = true;
    if (abs < silenceThreshold) silentSamples++;
  }

  const rms = Math.sqrt(sumSq / data.length);
  const peakDbfs = peakAbs > 0 ? 20 * Math.log10(peakAbs) : -Infinity;
  const rmsDbfs = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  const silenceRatio = data.length > 0 ? silentSamples / data.length : 1;
  const snrEstimate = computeSnrEstimate(data, silenceThreshold);

  const lowQuality = clipping || silenceRatio > 0.8 || peakDbfs < -40;

  return { peakDbfs, rmsDbfs, clipping, silenceRatio, snrEstimate, lowQuality };
}

// Module-level singleton — mobile Safari caps simultaneous AudioContexts at 6.
// Creating a new context per clip exhausts the cap and risks silent decode failures.
let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!_audioCtx || _audioCtx.state === "closed") {
    _audioCtx = new AudioCtx();
  }
  return _audioCtx;
}

/**
 * Decode an audio Blob to an AudioBuffer using the Web Audio API.
 * Returns null when decoding fails or AudioContext is unavailable (e.g. SSR).
 */
export async function decodeBlob(blob: Blob): Promise<AudioBuffer | null> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const ctx = getAudioContext();
    if (!ctx) return null;
    return await ctx.decodeAudioData(arrayBuffer);
  } catch {
    return null;
  }
}
