import {
  computeQualityMetrics,
  type QualityMetrics,
} from "../quality-metrics";

/** Build a minimal AudioBuffer stub. */
function makeBuffer(samples: Float32Array): AudioBuffer {
  return {
    getChannelData: (_channel: number) => samples,
    length: samples.length,
    numberOfChannels: 1,
    sampleRate: 48000,
    duration: samples.length / 48000,
  } as unknown as AudioBuffer;
}

/** Sine wave at given amplitude with the specified number of samples. */
function sineBuffer(amplitude: number, length = 48000): AudioBuffer {
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    data[i] = amplitude * Math.sin((2 * Math.PI * 440 * i) / 48000);
  }
  return makeBuffer(data);
}

describe("computeQualityMetrics", () => {
  describe("silent buffer (all zeros)", () => {
    let metrics: QualityMetrics;
    beforeAll(() => {
      metrics = computeQualityMetrics(makeBuffer(new Float32Array(4800)));
    });

    it("silenceRatio is 1.0", () => {
      expect(metrics.silenceRatio).toBeCloseTo(1.0);
    });
    it("lowQuality is true", () => {
      expect(metrics.lowQuality).toBe(true);
    });
    it("peakDbfs is -Infinity", () => {
      expect(metrics.peakDbfs).toBe(-Infinity);
    });
    it("rmsDbfs is -Infinity", () => {
      expect(metrics.rmsDbfs).toBe(-Infinity);
    });
    it("clipping is false", () => {
      expect(metrics.clipping).toBe(false);
    });
  });

  describe("clipped buffer (all 1.0)", () => {
    let metrics: QualityMetrics;
    beforeAll(() => {
      metrics = computeQualityMetrics(makeBuffer(new Float32Array(4800).fill(1.0)));
    });

    it("clipping is true", () => {
      expect(metrics.clipping).toBe(true);
    });
    it("lowQuality is true", () => {
      expect(metrics.lowQuality).toBe(true);
    });
    it("peakDbfs is 0", () => {
      expect(metrics.peakDbfs).toBeCloseTo(0, 1);
    });
    it("silenceRatio is 0", () => {
      expect(metrics.silenceRatio).toBe(0);
    });
  });

  describe("normal sine buffer (amplitude 0.3)", () => {
    let metrics: QualityMetrics;
    beforeAll(() => {
      metrics = computeQualityMetrics(sineBuffer(0.3));
    });

    it("clipping is false", () => {
      expect(metrics.clipping).toBe(false);
    });
    it("lowQuality is false", () => {
      expect(metrics.lowQuality).toBe(false);
    });
    it("peakDbfs near -10.5 dB", () => {
      // 20*log10(0.3) ≈ -10.46
      expect(metrics.peakDbfs).toBeCloseTo(-10.46, 0);
    });
    it("rmsDbfs near -13.0 dB (sine RMS = amplitude/√2)", () => {
      // 20*log10(0.3/√2) ≈ -13.47
      expect(metrics.rmsDbfs).toBeCloseTo(-13.47, 0);
    });
    it("silenceRatio is low", () => {
      expect(metrics.silenceRatio).toBeLessThan(0.05);
    });
  });

  describe("mixed buffer (half silence, half signal)", () => {
    let metrics: QualityMetrics;
    beforeAll(() => {
      const half = 24000;
      const data = new Float32Array(half * 2);
      // First half: zeros (silence)
      // Second half: sine at 0.3
      for (let i = half; i < half * 2; i++) {
        data[i] = 0.3 * Math.sin((2 * Math.PI * 440 * (i - half)) / 48000);
      }
      metrics = computeQualityMetrics(makeBuffer(data));
    });

    it("silenceRatio is approximately 0.5", () => {
      // Silence threshold is 0.01; first half is all 0 (silent), second half mostly not
      expect(metrics.silenceRatio).toBeGreaterThan(0.4);
      expect(metrics.silenceRatio).toBeLessThan(0.6);
    });
    it("snrEstimate is greater than 0", () => {
      expect(metrics.snrEstimate).toBeGreaterThan(0);
    });
  });

  describe("lowQuality flag edge cases", () => {
    it("flags lowQuality when peak < -40 dBFS", () => {
      // Amplitude 0.009 → 20*log10(0.009) ≈ -40.9 dBFS
      const m = computeQualityMetrics(sineBuffer(0.009, 48000));
      expect(m.lowQuality).toBe(true);
    });

    it("does NOT flag lowQuality for amplitude just above -40 dBFS threshold", () => {
      // Amplitude 0.12 → 20*log10(0.12) ≈ -18.4 dBFS (well above -40)
      const m = computeQualityMetrics(sineBuffer(0.12, 48000));
      expect(m.lowQuality).toBe(false);
    });

    it("flags lowQuality when silenceRatio > 0.8", () => {
      const data = new Float32Array(4800);
      // Signal in only the last 10% of samples (> 80% silent)
      for (let i = 4320; i < 4800; i++) {
        data[i] = 0.3 * Math.sin((2 * Math.PI * 440 * i) / 48000);
      }
      const m = computeQualityMetrics(makeBuffer(data));
      expect(m.silenceRatio).toBeGreaterThan(0.8);
      expect(m.lowQuality).toBe(true);
    });

    it("flags lowQuality when clipping", () => {
      const m = computeQualityMetrics(makeBuffer(new Float32Array(480).fill(1.0)));
      expect(m.clipping).toBe(true);
      expect(m.lowQuality).toBe(true);
    });
  });
});
