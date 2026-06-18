import { render, screen, act } from "@testing-library/react";
import { PromptedRecorder } from "../PromptedRecorder";
import { KEYWORDS } from "@/lib/keywords";

// ── Browser API mocks ──────────────────────────────────────────────────────

class FakeMediaRecorder {
  static isTypeSupported() { return true; }
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  state = "inactive";
  start() { this.state = "recording"; }
  stop() {
    if (this.state === "inactive") return;
    this.state = "inactive";
    // Fire data chunk then onstop so the Promise in recordFor resolves with a blob.
    this.ondataavailable?.({ data: new Blob(["x"], { type: "audio/webm" }) });
    this.onstop?.();
  }
}

const mockStream = { getTracks: () => [{ stop: jest.fn() }] };
const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);

beforeAll(() => {
  Object.defineProperty(global, "MediaRecorder", { value: FakeMediaRecorder, writable: true });
  Object.defineProperty(global.navigator, "mediaDevices", {
    value: { getUserMedia: mockGetUserMedia },
    writable: true,
  });
});

// ── Helpers ────────────────────────────────────────────────────────────────

function makeProps(
  overrides: Partial<{
    takeCounts: Record<string, number>;
    onTakeComplete: jest.Mock;
    onTakeCountsChange: jest.Mock;
  }> = {},
) {
  return {
    takeCounts: overrides.takeCounts ?? {},
    onTakeComplete: overrides.onTakeComplete ?? jest.fn(),
    onTakeCountsChange: overrides.onTakeCountsChange ?? jest.fn(),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PromptedRecorder", () => {
  afterEach(() => jest.useRealTimers());

  it("shows the first keyword in KEYWORDS definition order (hare → हरे)", () => {
    render(<PromptedRecorder {...makeProps()} />);
    expect(screen.getByText("हरे")).toBeInTheDocument();
  });

  it("shows 'Take 1 / 2' for the first keyword with no takes", () => {
    render(<PromptedRecorder {...makeProps()} />);
    expect(screen.getByText("Take 1 / 2")).toBeInTheDocument();
  });

  it("shows Start button when idle", () => {
    render(<PromptedRecorder {...makeProps()} />);
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("renders a chip for every keyword", () => {
    render(<PromptedRecorder {...makeProps()} />);
    for (const kw of KEYWORDS) {
      expect(
        screen.getByTitle(`${kw.transliteration}: 0/${kw.targetTakes}`),
      ).toBeInTheDocument();
    }
  });

  it("shows overall progress at 0%", () => {
    render(<PromptedRecorder {...makeProps()} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("reflects pre-existing take counts in the take label", () => {
    // hare already has 1 take → next is Take 2 / 2
    render(<PromptedRecorder {...makeProps({ takeCounts: { hare: 1 } })} />);
    expect(screen.getByText("Take 2 / 2")).toBeInTheDocument();
  });

  it("shows Pause and Next Word buttons while the cycle is running", async () => {
    jest.useFakeTimers();
    render(<PromptedRecorder {...makeProps()} />);

    await act(async () => {
      screen.getByRole("button", { name: /start/i }).click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next word/i })).toBeInTheDocument();
  });

  it("auto-calls onTakeComplete after one full recording cycle", async () => {
    jest.useFakeTimers();
    const onTakeComplete = jest.fn();
    const onTakeCountsChange = jest.fn();
    render(<PromptedRecorder {...makeProps({ onTakeComplete, onTakeCountsChange })} />);

    await act(async () => {
      screen.getByRole("button", { name: /start/i }).click();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Each sleep(700) creates its timer AFTER the previous resolves, so advance
    // one step at a time and let microtasks flush between each.
    await act(async () => { jest.advanceTimersByTime(700); }); // countdown 3
    await act(async () => { jest.advanceTimersByTime(700); }); // countdown 2
    await act(async () => { jest.advanceTimersByTime(700); }); // countdown 1 → recordFor starts
    // hare recordWindowMs = 1800 ms; FakeMediaRecorder.stop() fires onstop synchronously.
    await act(async () => { jest.advanceTimersByTime(1800); });
    await act(async () => { await Promise.resolve(); }); // flush continuation

    expect(onTakeComplete).toHaveBeenCalledTimes(1);
    const [label, blob, mimeType] = onTakeComplete.mock.calls[0] as [string, Blob, string];
    expect(label).toBe("hare");
    expect(blob).toBeInstanceOf(Blob);
    expect(mimeType).toMatch(/audio\/webm/);
    expect(onTakeCountsChange).toHaveBeenCalledWith(expect.objectContaining({ hare: 1 }));
  });
});
