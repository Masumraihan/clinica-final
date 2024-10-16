import { Document, Schema } from "mongoose";

export interface TWeight extends Document {
  user: Schema.Types.ObjectId;
  tracker: Schema.Types.ObjectId;
  weight: number;
  bmi: number;
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
