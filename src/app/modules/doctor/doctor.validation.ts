import { z } from "zod";

const createDoctorValidation = z.object({
        name: z.string({required_error:"Name is required"}),
        email: z.string({required_error:"Email is required"}).email({ message: "Invalid email address" }),
        password: z.string({required_error:"Password is required"}),
        contact: z.string({required_error:"Contact is required"}),
        experience: z.string({required_error:"Experience is required"}),
        address: z.string({required_error:"Address is required"}),
        title: z.string({required_error:"Title is required"}),
        gender: z.enum(["male", "female"],{required_error:"Gender is required"}),
        about: z.string().optional(),
})

const updateDoctorValidation = z.object({
        name: z.string({required_error:"Name is required"}),
        email: z.string({required_error:"Email is required"}).email({ message: "Invalid email address" }),
        profilePicture: z.string(),
        password: z.string({required_error:"Password is required"}),
        contact: z.string({required_error:"Contact is required"}),
        experience: z.string({required_error:"Experience is required"}),
        address: z.string({required_error:"Address is required"}),
        title: z.string({required_error:"Title is required"}),
        gender: z.enum(["male", "female"],{required_error:"Gender is required"}),
        about: z.string().optional(),
        dob: z.string().optional(),
}).partial().strict()

const doctorActionFromAdminValidation = z.object({
    body:z.object({
        isDelete: z.boolean().optional(),
        isActive: z.boolean().optional(),
    }).strict()
})

export const DoctorValidations = {
    createDoctorValidation,
    updateDoctorValidation,
    doctorActionFromAdminValidation
}