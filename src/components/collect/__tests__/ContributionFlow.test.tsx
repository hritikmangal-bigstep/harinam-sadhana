import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContributionFlow } from "../ContributionFlow";

const FIXED_UUID = "12345678-1234-4abc-89ab-123456789012";

jest.mock("@/lib/contributor-id", () => ({
  getContributorId: () => FIXED_UUID,
}));

// Bypass child step components so tests focus on ContributionFlow state machine.
jest.mock("../RecitationStep", () => ({
  RecitationStep: () => <div>RecitationStep</div>,
}));

// Suppress fire-and-forget fetch calls (sheets/kws, autosave).
global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);

describe("ContributionFlow", () => {
  it("mounts on step 1 and shows the Panch-tattva heading", () => {
    render(<ContributionFlow />);
    expect(screen.getByRole("heading", { name: "Panch-tattva" })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
  });

  it("re-render preserves step state", () => {
    const { rerender } = render(<ContributionFlow />);
    expect(screen.getByRole("heading", { name: "Panch-tattva" })).toBeInTheDocument();
    rerender(<ContributionFlow />);
    expect(screen.getByRole("heading", { name: "Panch-tattva" })).toBeInTheDocument();
  });

  it("Skip advances from step 1 to step 2 without marking step completed", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /skip this step/i }));

    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Maha-mantra" })).toBeInTheDocument();
  });

  it("Save & Continue advances to step 2", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    await user.click(screen.getByRole("button", { name: /save & continue/i }));

    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
  });

  it("shows the completion overlay after skipping all 2 steps", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByRole("button", { name: /skip this step/i }));
    }

    expect(screen.getByText(/thank you for your contribution/i)).toBeInTheDocument();
  });

  it("shows the completion overlay after saving through all 2 steps", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    await user.click(screen.getByRole("button", { name: /save & continue/i }));
    await user.click(screen.getByRole("button", { name: /save & finish/i }));

    expect(screen.getByText(/thank you for your contribution/i)).toBeInTheDocument();
  });

  it("completion overlay has a Submit Another Session button", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByRole("button", { name: /skip this step/i }));
    }

    expect(
      screen.getByRole("button", { name: /submit another session/i }),
    ).toBeInTheDocument();
  });
});
