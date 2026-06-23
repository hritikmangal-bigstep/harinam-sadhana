import { render, screen, fireEvent } from "@testing-library/react";
import { RecitationStep } from "../RecitationStep";
import type { RecordingValue } from "@/components/recorder/AudioRecorder";
import type { ClipMeta } from "../ContributionFlow";

// ── Mock AudioRecorder ─────────────────────────────────────────────────────

const mockOnChange = jest.fn<void, [RecordingValue | null]>();

jest.mock("@/components/recorder/AudioRecorder", () => ({
  AudioRecorder: ({
    onChange,
  }: {
    onChange: (v: RecordingValue | null) => void;
    hideReRecord?: boolean;
  }) => {
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
  beforeEach(() => mockOnChange.mockClear());

  it("renders the heading for step 2 (Panch-tattva)", () => {
    render(<RecitationStep step={2} onClipReady={makeOnClipReady()} />);
    expect(screen.getByText(/panch-tattva invocation/i)).toBeInTheDocument();
  });

  it("renders Devanagari mantra lines for step 2", () => {
    render(<RecitationStep step={2} onClipReady={makeOnClipReady()} />);
    expect(
      screen.getByText(/जय श्री कृष्ण चैतन्य प्रभु नित्यानन्द/),
    ).toBeInTheDocument();
  });

  it("renders the heading for step 3 (Maha-mantra)", () => {
    render(<RecitationStep step={3} onClipReady={makeOnClipReady()} />);
    expect(screen.getAllByText(/hare krishna maha-mantra/i).length).toBeGreaterThan(0);
  });

  it("renders Devanagari mantra lines for step 3", () => {
    render(<RecitationStep step={3} onClipReady={makeOnClipReady()} />);
    expect(
      screen.getByText(/हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे/),
    ).toBeInTheDocument();
  });

  it("renders the heading for step 4 (Full round)", () => {
    render(<RecitationStep step={4} onClipReady={makeOnClipReady()} />);
    expect(screen.getByText(/full round/i)).toBeInTheDocument();
  });

  it("calls onClipReady with panch_tattva_recitation immediately after recording (step 2)", () => {
    const onClipReady = makeOnClipReady();
    render(<RecitationStep step={2} onClipReady={onClipReady} />);

    simulateRecording();

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

  it("calls onClipReady with mahamantra_round immediately after recording (step 3)", () => {
    const onClipReady = makeOnClipReady();
    render(<RecitationStep step={3} onClipReady={onClipReady} />);
    simulateRecording();
    const [, , , meta] = onClipReady.mock.calls[0] as [string, Blob, string, ClipMeta];
    expect(meta.step).toBe("mahamantra_round");
  });

  it("calls onClipReady with panch_tattva_mahamantra_round immediately after recording (step 4)", () => {
    const onClipReady = makeOnClipReady();
    render(<RecitationStep step={4} onClipReady={onClipReady} />);
    simulateRecording();
    const [, , , meta] = onClipReady.mock.calls[0] as [string, Blob, string, ClipMeta];
    expect(meta.step).toBe("panch_tattva_mahamantra_round");
  });

  it("shows Re-record button after a recording completes", () => {
    render(<RecitationStep step={2} onClipReady={makeOnClipReady()} />);
    expect(screen.queryByRole("button", { name: /re-record/i })).not.toBeInTheDocument();
    simulateRecording();
    expect(screen.getByRole("button", { name: /re-record/i })).toBeInTheDocument();
  });

  it("Re-record hides the button and does not call onClipReady a second time", () => {
    const onClipReady = makeOnClipReady();
    render(<RecitationStep step={2} onClipReady={onClipReady} />);

    simulateRecording();
    expect(onClipReady).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /re-record/i }));

    expect(screen.queryByRole("button", { name: /re-record/i })).not.toBeInTheDocument();
    expect(onClipReady).toHaveBeenCalledTimes(1);
  });

  it("a second recording after Re-record enqueues a second clip", () => {
    const onClipReady = makeOnClipReady();
    render(<RecitationStep step={2} onClipReady={onClipReady} />);

    simulateRecording();
    fireEvent.click(screen.getByRole("button", { name: /re-record/i }));
    simulateRecording();

    expect(onClipReady).toHaveBeenCalledTimes(2);
  });
});
