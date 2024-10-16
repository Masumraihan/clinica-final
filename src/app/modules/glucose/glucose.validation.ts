import { z } from "zod";

// Zod schema for Glucose
const glucoseSchema = z.object({
    date: z.string({ required_error: "Date is required" }),
    time: z.string({ required_error: "Time is required" }),
    label: z.string({ required_error: "Label is required" }),
    data: z.number({ required_error: "Data value is required" }),
}).strict();

export const GlucoseValidations = {
    glucoseSchema
}