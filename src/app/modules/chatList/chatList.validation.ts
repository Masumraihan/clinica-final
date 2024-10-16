import { Types } from "mongoose";
import { z } from "zod";

const objectIdSchema = z.string().refine((value) => Types.ObjectId.isValid(value), {
  message: "Invalid ObjectId format",
});

const createChatListValidationSchema = z.object({
  body: z
    .object({
      participants: z.array(objectIdSchema, {
        required_error: "Participants is required",
        invalid_type_error: "Participants must be an array of ObjectId strings",
      }),
    })
    .strict(),
});

export const ChatListValidations = {
  createChatListValidationSchema,
};
