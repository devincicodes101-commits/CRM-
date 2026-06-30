import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IOperativeBonus extends Document {
  operative_id: string;
  operative_name: string;
  month_year: string;
  base_bonus: number;
  star_rating_bonus: number;
  job_performance_bonus: number;
  attendance_bonus: number;
  total_bonus: number;
  status: "pending" | "approved" | "paid";
  notes?: string;
  created_by_id?: string;
}

const OperativeBonusSchema = new Schema<IOperativeBonus>(
  {
    operative_id: { type: String, required: true },
    operative_name: { type: String, required: true },
    month_year: { type: String, required: true },
    base_bonus: { type: Number, default: 0 },
    star_rating_bonus: { type: Number, default: 0 },
    job_performance_bonus: { type: Number, default: 0 },
    attendance_bonus: { type: Number, default: 0 },
    total_bonus: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "approved", "paid"], default: "pending" },
    notes: { type: String },
  },
  baseSchemaOptions
);
addCreatedBy(OperativeBonusSchema);

OperativeBonusSchema.index({ operative_id: 1, month_year: 1 });

export const OperativeBonus =
  models.OperativeBonus || model<IOperativeBonus>("OperativeBonus", OperativeBonusSchema);
