import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface ICommissionSettings extends Document {
  rate_percent: number;
  qualifying_statuses: string[];
  period: "weekly" | "monthly";
  created_by_id?: string;
}

const CommissionSettingsSchema = new Schema<ICommissionSettings>(
  {
    rate_percent: { type: Number, default: 5 },
    qualifying_statuses: { type: [String], default: ["accepted"] },
    period: { type: String, enum: ["weekly", "monthly"], default: "weekly" },
  },
  baseSchemaOptions
);
addCreatedBy(CommissionSettingsSchema);

export const CommissionSettings =
  models.CommissionSettings || model<ICommissionSettings>("CommissionSettings", CommissionSettingsSchema);
