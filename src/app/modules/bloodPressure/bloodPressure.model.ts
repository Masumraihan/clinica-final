import { model, Schema } from "mongoose";
import { TBloodPressure } from "./bloodPressure.interface";

const bloodPressureSchema = new Schema<TBloodPressure>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    systolic: { type: Number, required: true },
    diastolic: { type: Number, required: true },
    data: { type: Number, required: true },
}, {
    timestamps: true, 
});

export const BloodPressureModel = model<TBloodPressure>('BloodPressure', bloodPressureSchema);