import { z } from "zod";

// Define a Zod schema for the ObjectId
const receiverId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Receiver Id");
const chatId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Chat Id");

const createMessageSchema = z
  .object({
    receiver: receiverId,
    text: z.string().optional(),
    file: z.string().optional(),
    seen: z.boolean().default(false),
    isDelete: z.boolean().default(false),
    chat: chatId,
  })
  .strict();

const updateMessageSchema = z
  .object({
    file: z.any({
      required_error: "File is required",
    }),
  })
  .strict();

export const MessageValidations = {
  createMessageSchema,
};
