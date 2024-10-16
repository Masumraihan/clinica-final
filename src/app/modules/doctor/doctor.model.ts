import { model, Schema } from "mongoose";
import { TDoctor } from "./doctor.interface";

const DoctorSchema = new Schema<TDoctor>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  experience: { type: String, required: true },
  address: { type: String, required: true },
  about: { type: String, default: null },
  dob: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isDelete: { type: Boolean, default: false },
});

const DoctorModel = model<TDoctor>("Doctor", DoctorSchema);
export default DoctorModel;
