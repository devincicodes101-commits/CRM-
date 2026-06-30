import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IBonusSettings extends Document {
  tier_name?: string;
  min_star_rating: number;
  min_jobs_completed?: number;
  max_completion_days?: number;
  min_attendance_percentage?: number;
  bonus_amount_gbp: number;
  is_active: boolean;
  priority?: number;
  created_by_id?: string;
}

const BonusSettingsSchema = new Schema<IBonusSettings>(
  {
    tier_name: { type: String },
    min_star_rating: { type: Number, required: true },
    min_jobs_completed: { type: Number },
    max_completion_days: { type: Number },
    min_attendance_percentage: { type: Number, min: 0, max: 100 },
    bonus_amount_gbp: { type: Number, required: true },
    is_active: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
  },
  baseSchemaOptions
);
addCreatedBy(BonusSettingsSchema);

export const BonusSettings =
  models.BonusSettings || model<IBonusSettings>("BonusSettings", BonusSettingsSchema);
