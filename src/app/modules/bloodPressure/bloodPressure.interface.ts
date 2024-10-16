import { Document, Schema } from "mongoose";

export interface TBloodPressure extends Document {
    user: Schema.Types.ObjectId;
    date: string ;
    time:string;
    systolic: number;
    diastolic: number;
    data: number;
}