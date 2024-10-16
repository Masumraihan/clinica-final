import { model, Schema } from "mongoose";
import { TWeightGainTracker } from "./weightGainTracker.interface";

const weightGainTrackerSchema = new Schema<TWeightGainTracker>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, },
    avgWeight: { type: Number, required: true },
    weight_gain_today: { type: Number, default: 0 },
    weight_gain_week: { type: Number, default: 0 },
    weight_gain_month: { type: Number, default: 0 },
}, {
    timestamps: true,
});

const WeightGainTrackerModel = model<TWeightGainTracker>('WeightGainTracker', weightGainTrackerSchema);
export default WeightGainTrackerModel