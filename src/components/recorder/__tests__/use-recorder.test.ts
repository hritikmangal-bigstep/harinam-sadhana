import { act, renderHook, waitFor } from "@testing-library/react";
import { useRecorder } from "../use-recorder";

// ── Web Audio / MediaRecorder mocks (jsdom has none of these) ──────────────
const trackStop = jest.fn();
let lastRecorder: MockRecorder | null = null;

class MockRecorder {
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(
    public stream: MediaStream,
    public opts: { mimeType: string },
  ) {
    lastRecorder = this;
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["x"], { type: "audio/webm" }) });
    this.onstop?.();
  }
  static isTypeSupported() {
    return true;
  }
}

let now = 0;

beforeEach(() => {
  now = 1_000_000;
  trackStop.mockClear();
  lastRecorder = null;
  jest.spyOn(Date, "now").mockImplementation(() => now);

  (global as unknown as { MediaRecorder: unknown }).MediaRecorder =
    MockRecorder;
  Object.defineProperty(global.navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: jest.fn(async () => ({
        getTracks: () => [{ stop: trackStop }],
      })),
    },
  });
  (global as unknown as { AudioContext: unknown }).AudioContext = class {
    createMediaStreamSource() {
      return { connect: jest.fn() };
    }
    createAnalyser() {
      return { fftSize: 0, frequencyBinCount: 16, getByteFrequencyData: jest.fn() };
    }
    close() {}
    state = "running";
  };
  global.requestAnimationFrame = (() => 1) as typeof requestAnimationFrame;
  global.cancelAnimationFrame = (() => {}) as typeof cancelAnimationFrame;
  global.URL.createObjectURL = jest.fn(() => "blob:mock");
  global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => jest.restoreAllMocks());

describe("useRecorder", () => {
  it("starts recording and requests the microphone", async () => {
    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      await result.current.start();
    });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true,
    });
    expect(result.current.status).toBe("recording");
  });

  it("completes with a blob when stopped after the minimum duration", async () => {
    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      await result.current.start();
    });
    now += 5000; // 5 seconds elapsed
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.status).toBe("completed"));
    expect(result.current.audioBlob).toBeInstanceOf(Blob);
    expect(result.current.seconds).toBe(5);
    expect(trackStop).toHaveBeenCalled(); // mic released on stop
  });

  it("flags too-short and returns to idle when released early", async () => {
    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      await result.current.start();
    });
    now += 1000; // only 1 second
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.tooShort).toBe(true);
    expect(result.current.audioBlob).toBeNull();
  });

  it("discards the recording on cancel", async () => {
    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      await result.current.start();
    });
    now += 9000;
    act(() => result.current.cancel());
    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.audioBlob).toBeNull();
    expect(trackStop).toHaveBeenCalled();
  });

  it("clears a completed recording on reset (re-record)", async () => {
    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      await result.current.start();
    });
    now += 4000;
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.status).toBe("completed"));
    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
    expect(result.current.audioBlob).toBeNull();
  });

  it("releases the mic stream on unmount", async () => {
    const { result, unmount } = renderHook(() => useRecorder());
    await act(async () => {
      await result.current.start();
    });
    unmount();
    expect(trackStop).toHaveBeenCalled();
  });
});
