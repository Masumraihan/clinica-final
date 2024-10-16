import { z } from "zod";

const createBloodPressure = z.object({
    date: z.string({ required_error: "Date is required" }),
    time: z.string({ required_error: "Time is required" }),
    systolic: z.number({ required_error: "Systolic value is required" }),
    diastolic: z.number({ required_error: "Diastolic value is required" }),
}).strict();


export const BloodPressureValidations = {
    createBloodPressure
}