import { z } from "zod";

const settingsValidationSchema = {
    body:z.object({
        label: z.string({required_error:"Label is required"}),
        content: z.string({required_error:"Content is required"}),
    }).strict()
}
export const SettingsValidations = {
    settingsValidationSchema
}