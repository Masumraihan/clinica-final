import { z } from "zod";

// Zod schema for Weight
const weightSchema = z.object({
  body: z
    .object({
      date: z
        .string({ required_error: "Date is required" }) // Accepts a string
        .transform((val) => new Date(val)),
      weight: z.number({ required_error: "Weight is required" }),
      notes: z.string().optional(),
    })
    .strict(),
});

export const WeightValidations = {
  weightSchema,
};
