import { z } from "zod";

/** Validation for a devotee's offering, run before any S3 upload. */
export const submissionSchema = z.object({
  name: z.string().trim().max(80, "Please use a shorter name.").optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type SubmissionFormValues = z.infer<typeof submissionSchema>;
