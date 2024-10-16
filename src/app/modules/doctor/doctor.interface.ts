import { Document, Schema } from "mongoose";

export interface TDoctor extends Document {
    user: Schema.Types.ObjectId;
    slug: string
    title: string;
    experience: string;
    dob: string;
    address: string;
    about:string;
    isActive: boolean;
    isDelete: boolean;
}