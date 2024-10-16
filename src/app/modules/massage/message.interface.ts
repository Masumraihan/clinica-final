import { Schema } from "mongoose";

export type TMessage = {
  text?: string;
  file?: string;
  seen: boolean;
  chat: Schema.Types.ObjectId;
  sender: Schema.Types.ObjectId;
  receiver: Schema.Types.ObjectId;
  isDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
};
