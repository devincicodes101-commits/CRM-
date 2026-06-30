import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IExtraWorkRequest extends Document {
  job_id: string;
  job_title?: string;
  contractor_id: string;
  contractor_user_id?: string;
  contractor_name?: string;
  description: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  created_at: Date;
  decided_at?: Date;
  decided_by?: string;
  created_by_id?: string;
}

const ExtraWorkRequestSchema = new Schema<IExtraWorkRequest>(
  {
    job_id: { type: String, required: true },
    job_title: { type: String },
    contractor_id: { type: String, required: true },
    contractor_user_id: { type: String },
    contractor_name: { type: String },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    created_at: { type: Date, default: () => new Date() },
    decided_at: { type: Date },
    decided_by: { type: String },
  },
  baseSchemaOptions
);
addCreatedBy(ExtraWorkRequestSchema);

ExtraWorkRequestSchema.index({ job_id: 1 });
ExtraWorkRequestSchema.index({ contractor_user_id: 1 });

export const ExtraWorkRequest =
  models.ExtraWorkRequest || model<IExtraWorkRequest>("ExtraWorkRequest", ExtraWorkRequestSchema);
