import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContributionFlow } from "../ContributionFlow";

const FIXED_UUID = "12345678-1234-4abc-89ab-123456789012";

jest.mock("@/lib/contributor-id", () => ({
  getContributorId: () => FIXED_UUID,
}));

// Bypass child step components so tests focus on ContributionFlow state machine.
jest.mock("../PromptedRecorder", () => ({
  PromptedRecorder: () => <div>PromptedRecorder</div>,
}));

jest.mock("../RecitationStep", () => ({
  RecitationStep: () => <div>RecitationStep</div>,
}));

// Suppress fire-and-forget fetch calls (sheets/kws, autosave).
global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);

describe("ContributionFlow", () => {
  it("mounts on step 1 and shows the Keywords heading", () => {
    render(<ContributionFlow />);
    expect(screen.getByRole("heading", { name: "Keywords" })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  });

  it("re-render preserves step state", () => {
    const { rerender } = render(<ContributionFlow />);
    expect(screen.getByRole("heading", { name: "Keywords" })).toBeInTheDocument();
    rerender(<ContributionFlow />);
    expect(screen.getByRole("heading", { name: "Keywords" })).toBeInTheDocument();
  });

  it("Skip advances from step 1 to step 2 without marking step completed", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /skip this step/i }));

    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Panch-tattva" })).toBeInTheDocument();
  });

  it("Save & Continue advances to step 2", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    await user.click(screen.getByRole("button", { name: /save & continue/i }));

    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  it("shows the completion overlay after skipping all 4 steps", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole("button", { name: /skip this step/i }));
    }

    expect(screen.getByText(/thank you for your contribution/i)).toBeInTheDocument();
  });

  it("shows the completion overlay after saving through all 4 steps", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("button", { name: /save & continue/i }));
    }
    await user.click(screen.getByRole("button", { name: /save & finish/i }));

    expect(screen.getByText(/thank you for your contribution/i)).toBeInTheDocument();
  });

  it("completion overlay has a Submit Another Session button", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole("button", { name: /skip this step/i }));
    }

    expect(
      screen.getByRole("button", { name: /submit another session/i }),
    ).toBeInTheDocument();
  });
});
