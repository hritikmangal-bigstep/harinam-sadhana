import { submissionSchema } from "../submission-schema";

const valid = {
  name: "Radha Devi",
  email: "radha@example.com",
  notes: "A peaceful morning.",
};

describe("submissionSchema", () => {
  it("accepts a complete valid submission", () => {
    expect(submissionSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts when optional notes are omitted", () => {
    const { notes, ...rest } = valid;
    void notes;
    expect(submissionSchema.safeParse(rest).success).toBe(true);
  });

  it("accepts an empty name (anonymous mode)", () => {
    expect(submissionSchema.safeParse({ ...valid, name: "" }).success).toBe(true);
  });

  it("accepts when email is omitted (anonymous mode)", () => {
    const { email, ...rest } = valid;
    void email;
    expect(submissionSchema.safeParse(rest).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(
      submissionSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects notes over 2000 characters", () => {
    expect(
      submissionSchema.safeParse({ ...valid, notes: "a".repeat(2001) }).success,
    ).toBe(false);
  });
});
