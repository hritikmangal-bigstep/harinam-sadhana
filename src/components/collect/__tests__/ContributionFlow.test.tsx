import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContributionFlow } from "../ContributionFlow";

const FIXED_UUID = "12345678-1234-4abc-89ab-123456789012";

jest.mock("@/lib/contributor-id", () => ({
  getContributorId: () => FIXED_UUID,
}));

describe("ContributionFlow", () => {
  it("mounts with a stable contributor ID on re-render", () => {
    const { rerender } = render(<ContributionFlow />);

    // Step 1 heading should be visible (query by heading role to avoid StepIndicator label clash)
    expect(screen.getByRole("heading", { name: "Keywords" })).toBeInTheDocument();

    // Re-render should not change visible state
    rerender(<ContributionFlow />);
    expect(screen.getByRole("heading", { name: "Keywords" })).toBeInTheDocument();
  });

  it("Skip on step 1 advances to step 2 without marking step 1 completed", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /skip this step/i }));

    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    // Step 2 heading shown
    expect(screen.getByRole("heading", { name: "Panch-tattva" })).toBeInTheDocument();

    // Step 1 circle should still contain "1" (not a checkmark SVG) since it was skipped
    const stepCircles = screen.getAllByRole("listitem");
    expect(stepCircles[0]).not.toHaveClass("bg-primary");
  });

  it("Save & Continue on step 1 marks step 1 completed and advances to step 2", async () => {
    const user = userEvent.setup();
    const onStepComplete = jest.fn().mockResolvedValue(undefined);
    render(<ContributionFlow onStepComplete={onStepComplete} />);

    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /save & continue/i }),
    );

    expect(onStepComplete).toHaveBeenCalledWith(1);
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Panch-tattva" })).toBeInTheDocument();
  });

  it("shows completion screen after going through all 4 steps via Skip", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("button", { name: /skip this step/i }));
    }
    // Now on step 4 — click Skip
    await user.click(screen.getByRole("button", { name: /skip this step/i }));

    expect(
      screen.getByText(/thank you for contributing/i),
    ).toBeInTheDocument();
  });

  it("shows completion screen after going through all 4 steps via Save & Continue", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    for (let i = 0; i < 3; i++) {
      await user.click(
        screen.getByRole("button", { name: /save & continue/i }),
      );
    }
    // On step 4 the button reads "Save & Finish"
    await user.click(
      screen.getByRole("button", { name: /save & finish/i }),
    );

    expect(
      screen.getByText(/thank you for contributing/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/you completed 4 steps/i)).toBeInTheDocument();
  });

  it("shows partial completion message when only step 1 is completed", async () => {
    const user = userEvent.setup();
    render(<ContributionFlow />);

    // Complete step 1, skip the rest
    await user.click(
      screen.getByRole("button", { name: /save & continue/i }),
    );
    await user.click(screen.getByRole("button", { name: /skip this step/i }));
    await user.click(screen.getByRole("button", { name: /skip this step/i }));
    await user.click(screen.getByRole("button", { name: /skip this step/i }));

    expect(
      screen.getByText(/thank you for contributing/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/you completed 1 step/i)).toBeInTheDocument();
  });
});
