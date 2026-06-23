import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DemographicsStep } from "../DemographicsStep";

describe("DemographicsStep", () => {
  it("calls onSkip without calling onSave when Skip is clicked", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onSkip = jest.fn();

    render(<DemographicsStep onSave={onSave} onSkip={onSkip} />);

    await user.click(screen.getByRole("button", { name: /skip/i }));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onSave with only the filled fields when Save & Continue is clicked", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onSkip = jest.fn();

    render(<DemographicsStep onSave={onSave} onSkip={onSkip} />);

    await user.type(screen.getByLabelText(/primary language spoken/i), "English");
    await user.selectOptions(screen.getByLabelText(/age group/i), "under_18");

    await user.click(screen.getByRole("button", { name: /save & continue/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      language: "English",
      ageGroup: "under_18",
      // all other fields are undefined — not passed
    });
  });

  it("calls onSave with an empty object when no fields are filled", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onSkip = jest.fn();

    render(<DemographicsStep onSave={onSave} onSkip={onSkip} />);

    await user.click(screen.getByRole("button", { name: /save & continue/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({});
  });

  it("disables the Save & Continue button while saving", async () => {
    const user = userEvent.setup();
    let resolveOnSave!: () => void;
    const onSave = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveOnSave = resolve;
        }),
    );
    const onSkip = jest.fn();

    render(<DemographicsStep onSave={onSave} onSkip={onSkip} />);

    const saveButton = screen.getByRole("button", { name: /save & continue/i });
    await user.click(saveButton);

    // Button should be disabled while the promise is pending
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveTextContent(/saving/i);

    // Resolve the promise and confirm it re-enables
    resolveOnSave();
    await screen.findByRole("button", { name: /save & continue/i });
    expect(saveButton).not.toBeDisabled();
  });

  it("renders all age group options", () => {
    render(
      <DemographicsStep onSave={jest.fn()} onSkip={jest.fn()} />,
    );

    const ageSelect = screen.getByLabelText(/age group/i);
    const options = Array.from((ageSelect as HTMLSelectElement).options).map(
      (o) => o.text,
    );

    expect(options).toContain("Under 18");
    expect(options).toContain("18–30");
    expect(options).toContain("31–50");
    expect(options).toContain("51+");
  });

});
