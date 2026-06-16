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
  it("shows the recording prompt when submitting without a recording", async () => {
    const user = userEvent.setup();
    render(<SubmissionForm />);

    await user.click(screen.getByRole("button", { name: /submit my japa/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/record your chanting before submitting/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not call the API while the required recording is missing", async () => {
    const user = userEvent.setup();
    render(<SubmissionForm />);

    // Switch to named mode and fill in details — recording still absent
    await user.click(screen.getByRole("button", { name: /get beta access/i }));
    await user.type(screen.getByLabelText(/name/i), "Radha");
    await user.click(screen.getByRole("button", { name: /submit my japa/i }));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
