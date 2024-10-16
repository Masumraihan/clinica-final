import { Document, Schema } from "mongoose";

//fasting glucose
//1-hour postprandial glucose
//2-hour postprandial glucose
//Free measurement

type TGlucoseLabel =
  | "Fasting Glucose"
  | "1-hour postprandial glucose"
  | "2-hour postprandial glucose"
  | "Free Measurement";

export interface TGlucose extends Document {
  user: Schema.Types.ObjectId;
  date: string;
  time: string;
  label: TGlucoseLabel;
  data: number;
}
