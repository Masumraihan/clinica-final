import { Document } from "mongoose";

export interface TUser extends Document {
  name: string;
  slug: string;
  email: string;
  profilePicture: string | null;
  contact: string;
  password: string;
  role: string;
  gender: TGender;
  isActive: boolean;
  isDelete: boolean;
  validation?: TValidation;
  fcmToken?: string;
}

export type TValidation = {
  otp: number;
  expiry: string | null;
  isVerified: boolean;
};
export type TGender = "male" | "female";
