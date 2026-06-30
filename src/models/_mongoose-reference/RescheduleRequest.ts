import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IRescheduleRequest extends Document {
  job_id: string;
  customer_email: string;
  customer_name: string;
  job_title?: string;
  original_date?: Date;
  requested_date?: Date;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  request_date?: Date;
  created_by_id?: string;
}

const RescheduleRequestSchema = new Schema<IRescheduleRequest>(
  {
    job_id: { type: String, required: true },
    customer_email: { type: String, required: true },
    customer_name: { type: String, required: true },
    job_title: { type: String },
    original_date: { type: Date },
    requested_date: { type: Date },
    reason: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    notes: { type: String },
    request_date: { type: Date, default: () => new Date() },
  },
  baseSchemaOptions
);
addCreatedBy(RescheduleRequestSchema);

RescheduleRequestSchema.index({ job_id: 1 });

export const RescheduleRequest =
  models.RescheduleRequest || model<IRescheduleRequest>("RescheduleRequest", RescheduleRequestSchema);
