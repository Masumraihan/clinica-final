import { Document, Schema } from "mongoose";

export interface TNotification extends Document {
  user?: Schema.Types.ObjectId;
  fcmToken: string;
  type?: "connection" | "glucose" | "bloodPressure" | "weight" | "message";
  title?: string;
  message: string;
  isRead: boolean;
  link?: string;
  date?: Date;
  time?: string;
}
