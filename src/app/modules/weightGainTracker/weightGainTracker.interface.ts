import { Schema } from "mongoose"

export type TWeightGainTracker = {
    _id: Schema.Types.ObjectId,
    user: Schema.Types.ObjectId,
    avgWeight: { type: Number, required: true },
    weight_gain_today: number,
    weight_gain_week: number,
    weight_gain_month: number,
}