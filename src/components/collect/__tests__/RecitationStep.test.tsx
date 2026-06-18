import { render, screen, fireEvent } from "@testing-library/react";
import { RecitationStep } from "../RecitationStep";
import type { RecordingValue } from "@/components/recorder/AudioRecorder";
import type { ClipMeta } from "../ContributionFlow";

// ── Mock AudioRecorder ─────────────────────────────────────────────────────
// Web Audio is unavailable in Jest — replace with a simple trigger button.
const mockOnChange = jest.fn<void, [RecordingValue | null]>();

jest.mock("@/components/recorder/AudioRecorder", () => ({
  AudioRecorder: ({ onChange }: { onChange: (v: RecordingValue | null) => void }) => {
    mockOnChange.mockImplementation(onChange);
    return (
      <button
        data-testid="mock-recorder"
        onClick={() =>
          onChange({
            blob: new Blob(["audio"], { type: "audio/webm" }),
            mimeType: "audio/webm",
            seconds: 5,
          })
        }
      >
        Record
      </button>
    );
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeOnClipReady() {
  return jest.fn<void, [string, Blob, string, ClipMeta]>();
}

function simulateRecording() {
  fireEvent.click(screen.getByTestId("mock-recorder"));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("RecitationStep", () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders the correct prompt for step 2 (Panch-tattva)", () => {
    render(<RecitationStep step={2} onClipReady={makeOnClipReady()} />);
    expect(screen.getByText(/panch-tattva invocation/i)).toBeInTheDocument();
    expect(
      screen.getByText(/please recite the panch-tattva mantra/i),
    ).toBeInTheDocument();
  });

  it("renders the correct prompt for step 3 (Maha-mantra)", () => {
    render(<RecitationStep step={3} onClipReady={makeOnClipReady()} />);
    expect(screen.getAllByText(/hare krishna maha-mantra/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/please chant one full round/i),
    ).toBeInTheDocument();
  });

  it("renders the correct prompt for step 4 (Full round)", () => {
    render(<RecitationStep step={4} onClipReady={makeOnClipReady()} />);
    expect(screen.getByText(/full round/i)).toBeInTheDocument();
    expect(
      screen.getByText(/panch-tattva invocation followed by one complete round/i),
    ).toBeInTheDocument();
  });

  it("'Save recording' calls onClipReady with panch_tattva_recitation for step 2", () => {
    const onClipReady = makeOnClipReady();
    render(<RecitationStep step={2} onClipReady={onClipReady} />);

    simulateRecording();
    const saveBtn = screen.getByRole("button", { name: /save recording/i });
    fireEvent.click(saveBtn);

    expect(onClipReady).toHaveBeenCalledTimes(1);
    const [clipId, blob, mimeType, meta] = onClipReady.mock.calls[0] as [
      string,
      Blob,
      string,
      ClipMeta,
    ];
    expect(typeof clipId).toBe("string");
    expect(clipId.length).toBeGreaterThan(0);
    expect(blob).toBeInstanceOf(Blob);
    expect(mimeType).toBe("audio/webm");
    expect(meta.step).toBe("panch_tattva_recitation");
    expect(meta.durationMs).toBe(5000);
  });

  it("'Save recording' calls onClipReady with mahamantra_round for step 3", () => {
    const onClipReady = makeOnClipReady();
    render(<RecitationStep step={3} onClipReady={onClipReady} />);

    simulateRecording();
    fireEvent.click(screen.getByRole("button", { name: /save recording/i }));

    expect(onClipReady).toHaveBeenCalledTimes(1);
    const [, , , meta] = onClipReady.mock.calls[0] as [string, Blob, string, ClipMeta];
    expect(meta.step).toBe("mahamantra_round");
  });

  it("'Save recording' calls onClipReady with panch_tattva_mahamantra_round for step 4", () => {
    const onClipReady = makeOnClipReady();
    render(<RecitationStep step={4} onClipReady={onClipReady} />);

    simulateRecording();
    fireEvent.click(screen.getByRole("button", { name: /save recording/i }));

    expect(onClipReady).toHaveBeenCalledTimes(1);
    const [, , , meta] = onClipReady.mock.calls[0] as [string, Blob, string, ClipMeta];
    expect(meta.step).toBe("panch_tattva_mahamantra_round");
  });

  it("'Re-record' clears pending without calling onClipReady", () => {
    const onClipReady = makeOnClipReady();
    render(<RecitationStep step={2} onClipReady={onClipReady} />);

    simulateRecording();
    expect(screen.getByRole("button", { name: /save recording/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /re-record/i }));

    expect(onClipReady).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /save recording/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /re-record/i })).not.toBeInTheDocument();
  });

  it("after 'Save recording', recorder resets and a new recording can be captured", () => {
    const onClipReady = makeOnClipReady();
    render(<RecitationStep step={2} onClipReady={onClipReady} />);

    // First recording
    simulateRecording();
    fireEvent.click(screen.getByRole("button", { name: /save recording/i }));
    expect(onClipReady).toHaveBeenCalledTimes(1);

    // Action buttons should be gone
    expect(screen.queryByRole("button", { name: /save recording/i })).not.toBeInTheDocument();

    // Second recording — recorder has remounted so mock-recorder is available again
    simulateRecording();
    fireEvent.click(screen.getByRole("button", { name: /save recording/i }));
    expect(onClipReady).toHaveBeenCalledTimes(2);
  });
});
