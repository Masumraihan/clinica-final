import { model, Schema } from "mongoose";
import { TGlucose } from "./glucose.interface";

// Schema for Glucose
const glucoseSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    label: {
      type: String,
      enum: [
        "Fasting Glucose",
        "1-hour postprandial glucose",
        "2-hour postprandial glucose",
        "Free Measurement",
      ],
      required: true,
    },
    data: { type: Number, required: true },
  },
  {
    timestamps: true,
  },
);

export const GlucoseModel = model<TGlucose>("Glucose", glucoseSchema);
