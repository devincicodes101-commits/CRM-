import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IJobMessage extends Document {
  job_id: string;
  job_title?: string;
  sender_role: "office" | "contractor" | "client";
  sender_name?: string;
  body: string;
  created_at: Date;
  assigned_contractor_user_id?: string;
  created_by_id?: string;
}

const JobMessageSchema = new Schema<IJobMessage>(
  {
    job_id: { type: String, required: true },
    job_title: { type: String },
    sender_role: { type: String, enum: ["office", "contractor", "client"], required: true },
    sender_name: { type: String },
    body: { type: String, required: true },
    created_at: { type: Date, default: () => new Date() },
    assigned_contractor_user_id: { type: String },
  },
  baseSchemaOptions
);
addCreatedBy(JobMessageSchema);

JobMessageSchema.index({ job_id: 1 });

export const JobMessage = models.JobMessage || model<IJobMessage>("JobMessage", JobMessageSchema);
