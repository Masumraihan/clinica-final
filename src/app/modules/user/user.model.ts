import { model, Schema } from "mongoose";
import { TUser, TValidation } from "./user.interface";

const validationSchema = new Schema<TValidation>({
  otp: { type: Number, default: 0, select: 0 },
  expiry: { type: String, default: null, select: 0 },
  isVerified: { type: Boolean, default: false },
});

const UserSchema = new Schema<TUser>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, required: true },
    gender: { type: String, enum: ["male", "female"] },
    profilePicture: { type: String, default: null },
    password: { type: String, required: true, select: 0 },
    role: { type: String, enum: ["admin", "patient", "doctor"], required: true },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    fcmToken: { type: String, default: null },
    validation: { type: validationSchema },
  },
  {
    timestamps: true,
  },
);

UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDelete: false } });
UserSchema.index({ contact: 1 }, { unique: true, partialFilterExpression: { isDelete: false } });
UserSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { isDelete: false } });
UserSchema.index({ name: 1 }, { unique: true, partialFilterExpression: { isDelete: false } });

const UserModel = model<TUser>("User", UserSchema);
export default UserModel;
