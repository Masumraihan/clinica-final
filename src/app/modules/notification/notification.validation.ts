import { z } from "zod"

const createNotificationValidation = z.object({
    body:z.object({
        title: z.string({required_error:"Title is required"}),
        message: z.string({required_error:"Message is required"}),
    }).strict()
})

export const NotificationValidations = {
}