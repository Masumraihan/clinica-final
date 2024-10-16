import { Document, Schema } from "mongoose";

export interface TChatList extends Document {
  participants: Schema.Types.ObjectId[];
  isDelete?: boolean;
}
