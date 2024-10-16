import { model, Schema } from "mongoose";
import { TPatient } from "./patient.interface";

// Patient Schema
const PatientSchema = new Schema<TPatient>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    slug: { type: String, required: true },
    dateOfBirth: { type: String, default: null },
    bloodGroup: {
      type: String,
      enum: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
      default: null,
    },
    height: { type: String, default: null },
    lastMenstrualPeriod: { type: String, default: null },
    weightBeginningPregnancy: { type: String, default: null },
    pregnancyType: { type: String, enum: ["single", "multiple"], default: "single" },
    lastPregnancyTime: { type: String, default: null },
    currentPregnancyTime: { type: String, default: null },
    vitroFertilization: { type: Boolean, default: false },
    chronicHypertension: { type: Boolean, default: false },
    lupus: { type: Boolean, default: false },
    gestationalAge: { type: Number, default: null },
    antiphospholipidSyndrome: { type: Boolean, default: false },
    motherPreeclampsiaHistory: { type: Boolean, default: false },
    firstPregnancy: { type: Boolean, default: false },
    historyOfPreeclampsia: { type: Boolean, default: false },
    babyBelow2500Grams: { type: Boolean, default: false },
    higherRiskOfPreeclampsia: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    bloodPressureAlert: { type: Boolean, default: false },
    glucoseAlert: { type: Boolean, default: false },
    weightAlert: { type: Boolean, default: false },
    age: { type: Number, default: null },
  },
  {
    timestamps: true,
  },
);

PatientSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { isDelete: false } });
PatientSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { isDelete: false } });

const PatientModel = model<TPatient>("Patient", PatientSchema);

export default PatientModel;
