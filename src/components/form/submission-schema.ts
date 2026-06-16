import { z } from "zod";

/** Validation for a devotee's offering, run before any S3 upload. */
export const submissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "This field is required to complete your offering.")
    .max(80, "Please use a shorter name."),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type SubmissionFormValues = z.infer<typeof submissionSchema>;
