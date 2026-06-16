import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubmissionForm } from "../SubmissionForm";

// The presigned-URL API is always mocked — tests never hit the network.
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  global.URL.createObjectURL = jest.fn(() => "blob:mock");
  global.URL.revokeObjectURL = jest.fn();
});

describe("SubmissionForm validation", () => {
  it("shows field errors and the recording prompt on an empty submit", async () => {
    const user = userEvent.setup();
    render(<SubmissionForm />);

    await user.click(screen.getByRole("button", { name: /offer my session/i }));

    const errors = await screen.findAllByRole("alert");
    // name + location + rounds + recording prompt at minimum.
    expect(errors.length).toBeGreaterThanOrEqual(3);
    expect(
      screen.getByText(/record your chanting before offering/i),
    ).toBeInTheDocument();
    // Validation fails before any network call.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not call the API while required fields are missing", async () => {
    const user = userEvent.setup();
    render(<SubmissionForm />);

    await user.type(screen.getByLabelText(/name/i), "Radha");
    await user.click(screen.getByRole("button", { name: /offer my session/i }));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
