
import { model, Schema } from "mongoose";
import { TSettings } from "./settings.interface";

const SettingsSchema = new Schema<TSettings>({
    label: { type: String, required: true },
    content: { type: String, required: true },
})


export const SettingsModel = model<TSettings>('Settings', SettingsSchema)