import { model, Schema } from "mongoose";
import { TWeight } from "./weight.interface";

// Schema for Weight
const weightSchema = new Schema<TWeight>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tracker: { type: Schema.Types.ObjectId, ref: "WeightGainTracker", required: true },
    weight: { type: Number, required: true },
    bmi: { type: Number, required: true },
    notes: { type: String, default: null },
    date: { type: Date, required: true },
  },
  {
    timestamps: true,
  },
);

export const WeightModel = model<TWeight>("Weight", weightSchema);
