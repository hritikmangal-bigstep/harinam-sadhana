import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContributionFlow } from "../ContributionFlow";

const FIXED_UUID = "12345678-1234-4abc-89ab-123456789012";

jest.mock("@/lib/contributor-id", () => ({
  getContributorId: () => FIXED_UUID,
}));

// Bypass the demographics gate so ContributionFlow tests focus on the step wizard.
jest.mock("../DemographicsStep", () => ({
  DemographicsStep: ({ onSkip }: { onSkip: () => void; onSave: (d: unknown) => Promise<void> }) => (
    <button onClick={onSkip}>Skip demographics</button>
  ),
}));

// Bypass child step components so tests focus on ContributionFlow state machine.
jest.mock("../PromptedRecorder", () => ({
  PromptedRecorder: () => <div>PromptedRecorder</div>,
}));

jest.mock("../RecitationStep", () => ({
  RecitationStep: () => <div>RecitationStep</div>,
}));

// Suppress fire-and-forget fetch calls (sheets/kws, autosave) — no server in tests.
global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);

/** Click through the demographics gate so each test starts at the step wizard. */
async function skipDemographics(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /skip demographics/i }));
}

describe("ContributionFlow", () => {
  it("mounts with a stable contributor ID on re-render", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ContributionFlow />);
    await skipDemographics(user);

    // Step 1 heading should be visible
    expect(screen.getByRole("heading", { name: "Keywords" })).toBeInTheDocument();

    // Re-render preserves state — still on Step 1, demographics gate already passed
    rerender(<ContributionFlow />);
    expect(screen.getByRole("heading", { name: "Keywords" })).toBeInTheDocument();
  });

  it("Skip on step 1 advances to step 2 without marking step 1 completed", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);
    await skipDemographics(user);

    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /skip this step/i }));

    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Panch-tattva" })).toBeInTheDocument();
  });

  it("Save & Continue on step 1 marks step 1 completed and advances to step 2", async () => {
    const user = userEvent.setup();
    const onStepComplete = jest.fn().mockResolvedValue(undefined);
    render(<ContributionFlow onStepComplete={onStepComplete} />);
    await skipDemographics(user);

    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save & continue/i }));

    expect(onStepComplete).toHaveBeenCalledWith(1);
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Panch-tattva" })).toBeInTheDocument();
  });

  it("shows completion screen after going through all 4 steps via Skip", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);
    await skipDemographics(user);

    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole("button", { name: /skip this step/i }));
    }

    expect(screen.getByText(/thank you for contributing/i)).toBeInTheDocument();
  });

  it("shows completion screen after going through all 4 steps via Save & Continue", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);
    await skipDemographics(user);

    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("button", { name: /save & continue/i }));
    }
    // On step 4 the button reads "Save & Finish"
    await user.click(screen.getByRole("button", { name: /save & finish/i }));

    expect(screen.getByText(/thank you for contributing/i)).toBeInTheDocument();
    expect(screen.getByText(/you completed 4 steps/i)).toBeInTheDocument();
  });

  it("shows partial completion message when only step 1 is completed", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);
    await skipDemographics(user);

    // Complete step 1, skip the rest
    await user.click(screen.getByRole("button", { name: /save & continue/i }));
    await user.click(screen.getByRole("button", { name: /skip this step/i }));
    await user.click(screen.getByRole("button", { name: /skip this step/i }));
    await user.click(screen.getByRole("button", { name: /skip this step/i }));

    expect(screen.getByText(/thank you for contributing/i)).toBeInTheDocument();
    expect(screen.getByText(/you completed 1 step/i)).toBeInTheDocument();
  });
});
