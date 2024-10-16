import { z } from "zod";

const updateAdminProfileSchema = z.object({
        name: z.string(),
        email: z.string().email("Invalid email"),
        contact: z.string(),
        gender: z.enum(["male", "female"]),
        profilePicture: z.string().optional(),
    }).partial().strict()

export const UserValidations = {
    updateAdminProfileSchema
}