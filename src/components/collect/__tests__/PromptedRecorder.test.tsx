import { render, screen, fireEvent } from "@testing-library/react";
import { PromptedRecorder } from "../PromptedRecorder";
import type { RecordingValue } from "@/components/recorder/AudioRecorder";

// ── Mock AudioRecorder ─────────────────────────────────────────────────────
// Complex Web Audio component — replace with a simple trigger for tests.
const mockOnChange = jest.fn<void, [RecordingValue | null]>();

jest.mock("@/components/recorder/AudioRecorder", () => ({
  AudioRecorder: ({ onChange }: { onChange: (v: RecordingValue | null) => void }) => {
    // Store the callback so tests can invoke it directly.
    mockOnChange.mockImplementation(onChange);
    return (
      <button
        data-testid="mock-recorder"
        onClick={() =>
          onChange({
            blob: new Blob(["audio"], { type: "audio/webm" }),
            mimeType: "audio/webm",
            seconds: 2,
          })
        }
      >
        Record
      </button>
    );
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeMockProps(
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

// Simulate a full recording: click the mock recorder → click "Save take"
function simulateTake(container: HTMLElement) {
  fireEvent.click(screen.getByTestId("mock-recorder"));
  const saveBtn = container.querySelector("button[type=button]");
  // The first button after capture is "Save take"
  const saveTake = screen.getByRole("button", { name: /save take/i });
  fireEvent.click(saveTake);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PromptedRecorder", () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("auto-picks the fewest-taken keyword on mount and shows its Devanagari text", () => {
    const props = makeMockProps();
    render(<PromptedRecorder {...props} />);

    // With no takes at all, alphabetically first is "advaita" → "अद्वैत"
    expect(screen.getByText("अद्वैत")).toBeInTheDocument();
  });

  it("shows take count display in 'Take N / 30' format", () => {
    const props = makeMockProps({ takeCounts: { advaita: 4 } });
    render(<PromptedRecorder {...props} />);

    // advaita has 4 takes, but the next keyword with fewest takes is shown
    // All others have 0, so it picks next alphabetically among 0-count: "chaitanya"
    // advaita:4, all others 0 → picks chaitanya (alphabetically first at 0)
    expect(screen.getByText(/Take 1 \/ 30/)).toBeInTheDocument();
  });

  it("when a take completes: increments count, calls onTakeComplete, calls onTakeCountsChange", () => {
    const onTakeComplete = jest.fn();
    const onTakeCountsChange = jest.fn();
    const props = makeMockProps({ onTakeComplete, onTakeCountsChange });
    const { container } = render(<PromptedRecorder {...props} />);

    // Trigger a recording
    fireEvent.click(screen.getByTestId("mock-recorder"));

    // "Save take" button appears after recording
    const saveBtn = screen.getByRole("button", { name: /save take/i });
    fireEvent.click(saveBtn);

    expect(onTakeComplete).toHaveBeenCalledTimes(1);
    const [label, blob, mimeType] = onTakeComplete.mock.calls[0] as [
      string,
      Blob,
      string,
    ];
    expect(typeof label).toBe("string");
    expect(blob).toBeInstanceOf(Blob);
    expect(mimeType).toBe("audio/webm");

    expect(onTakeCountsChange).toHaveBeenCalledTimes(1);
    const updatedCounts = onTakeCountsChange.mock.calls[0][0] as Record<
      string,
      number
    >;
    expect(updatedCounts[label]).toBe(1);
  });

  it("after completing a take, advances to a different active keyword", () => {
    const props = makeMockProps();
    render(<PromptedRecorder {...props} />);

    // Initial keyword — advaita (alphabetically first at 0)
    const initialText = screen.getByText("अद्वैत");
    expect(initialText).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("mock-recorder"));
    fireEvent.click(screen.getByRole("button", { name: /save take/i }));

    // After one take of advaita (count=1), chaitanya (count=0) should become active
    expect(screen.queryByText("अद्वैत")).not.toBeInTheDocument();
    // chaitanya → चैतन्य
    expect(screen.getByText("चैतन्य")).toBeInTheDocument();
  });

  it("Re-record button discards the take without calling onTakeComplete", () => {
    const onTakeComplete = jest.fn();
    const props = makeMockProps({ onTakeComplete });
    render(<PromptedRecorder {...props} />);

    // Trigger a recording
    fireEvent.click(screen.getByTestId("mock-recorder"));

    // "Re-record" button appears
    const reRecordBtn = screen.getByRole("button", { name: /re-record/i });
    fireEvent.click(reRecordBtn);

    expect(onTakeComplete).not.toHaveBeenCalled();

    // The confirm/discard buttons should have disappeared
    expect(screen.queryByRole("button", { name: /save take/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /re-record/i })).not.toBeInTheDocument();
  });

  it("shows 'Take 1 / 30' for a keyword with no takes yet", () => {
    const props = makeMockProps({ takeCounts: {} });
    render(<PromptedRecorder {...props} />);
    expect(screen.getByText("Take 1 / 30")).toBeInTheDocument();
  });

  it("shows correct take number when some takes already exist", () => {
    // Give advaita 7 takes; it's still alphabetically first among equals when others=0
    // But all others are 0, so advaita won't be picked (advaita:7, others:0 → picks others)
    // Give all keywords 5 takes, then advaita is still first alphabetically at 5
    const counts: Record<string, number> = {};
    // Set all to 5 so advaita is picked (alphabetically first among equal)
    for (const label of [
      "advaita","chaitanya","gadadhara","hare","hare_krishna","hare_rama",
      "jaya","krishna","krishna_krishna","nityananda","rama","rama_rama",
      "sri","srivasa",
    ]) {
      counts[label] = 5;
    }
    render(<PromptedRecorder {...makeMockProps({ takeCounts: counts })} />);
    // advaita has 5 takes, next would be take 6
    expect(screen.getByText("Take 6 / 30")).toBeInTheDocument();
  });
});
