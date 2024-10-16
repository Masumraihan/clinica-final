import { z } from "zod";

const createConnectionValidation = {
    body: z.object({
        doctorId: z.string({ required_error: "Doctor Id is required" }),
    })
}

const updateConnectionValidation = {
    body: z.object({
        connectionId: z.string({ required_error: "Connection Id is required" }),
        status: z.enum(["pending", "accept", "reject"])
    })
}

const cancelConnectionValidation = {
    body: z.object({
        connectionId: z.string({ required_error: "Connection Id is required" }),
    })
}

export const connectionValidations = {
    createConnectionValidation,
    updateConnectionValidation,
    cancelConnectionValidation
}