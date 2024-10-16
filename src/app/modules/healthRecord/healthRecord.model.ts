import { model, Schema } from "mongoose";
import { THealthRecord } from "./healthRecord.interface";

const HealthRecordSchema = new Schema<THealthRecord>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        file: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);


export const HealthRecordModel = model<THealthRecord>("HealthRecord", HealthRecordSchema)