import { Document, Schema } from "mongoose";

export interface TPatient extends Document {
  user: Schema.Types.ObjectId;
  slug: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  height?: string;
  lastMenstrualPeriod?: string;
  weightBeginningPregnancy?: string;
  pregnancyType?: "single" | "multiple";
  lastPregnancyTime?: string;
  currentPregnancyTime?: string;
  vitroFertilization?: boolean;
  chronicHypertension?: boolean;
  lupus?: boolean;
  antiphospholipidSyndrome?: boolean;
  motherPreeclampsiaHistory?: boolean;
  firstPregnancy?: boolean;
  historyOfPreeclampsia?: boolean;
  babyBelow2500Grams?: boolean;
  higherRiskOfPreeclampsia?: boolean;
  gestationalAge?: number;
  isActive: boolean;
  isDelete: boolean;
  bloodPressureAlert: boolean;
  glucoseAlert: boolean;
  weightAlert: boolean;
  age: number;
}

export type TBloodGroup = "O+" | "O-" | "A+" | "A- " | "B+" | "B-" | "AB+" | "AB-";
