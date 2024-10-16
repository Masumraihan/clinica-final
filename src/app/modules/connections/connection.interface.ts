import { Document, Schema } from "mongoose";

export interface TConnection extends Document {
    patient: Schema.Types.ObjectId;
    doctor: Schema.Types.ObjectId;
    status: TConnectionStatus;
}


export type TConnectionStatus = "pending" | "accept" | "reject"