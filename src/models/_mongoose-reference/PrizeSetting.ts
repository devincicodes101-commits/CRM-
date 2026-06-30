import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IPrizeSetting extends Document {
  wheel_type: "crm" | "field";
  prize_description: string;
  prize_emoji?: string;
  is_active: boolean;
  created_by_id?: string;
}

const PrizeSettingSchema = new Schema<IPrizeSetting>(
  {
    wheel_type: { type: String, enum: ["crm", "field"], required: true },
    prize_description: { type: String, required: true },
    prize_emoji: { type: String },
    is_active: { type: Boolean, default: true },
  },
  baseSchemaOptions
);
addCreatedBy(PrizeSettingSchema);

export const PrizeSetting =
  models.PrizeSetting || model<IPrizeSetting>("PrizeSetting", PrizeSettingSchema);
