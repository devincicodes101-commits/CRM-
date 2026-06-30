import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IJobChat extends Document {
  job_id: string;
  job_title?: string;
  job_date?: Date;
  sender_name: string;
  sender_role?: "admin" | "operative" | "customer";
  message: string;
  is_read: boolean;
  created_by_id?: string;
}

const JobChatSchema = new Schema<IJobChat>(
  {
    job_id: { type: String, required: true },
    job_title: { type: String },
    job_date: { type: Date },
    sender_name: { type: String, required: true },
    sender_role: { type: String, enum: ["admin", "operative", "customer"] },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
  },
  baseSchemaOptions
);
addCreatedBy(JobChatSchema);

JobChatSchema.index({ job_id: 1 });

export const JobChat = models.JobChat || model<IJobChat>("JobChat", JobChatSchema);
