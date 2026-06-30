import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IJobBid extends Document {
  job_id: string;
  job_title?: string;
  job_start_date?: Date;
  job_address?: string;
  job_description?: string;
  subcontractor_id: string;
  subcontractor_name?: string;
  subcontractor_company?: string;
  amount: number;
  estimated_days?: number;
  notes?: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_by_id?: string;
}

const JobBidSchema = new Schema<IJobBid>(
  {
    job_id: { type: String, required: true },
    job_title: { type: String },
    job_start_date: { type: Date },
    job_address: { type: String },
    job_description: { type: String },
    subcontractor_id: { type: String, required: true },
    subcontractor_name: { type: String },
    subcontractor_company: { type: String },
    amount: { type: Number, required: true },
    estimated_days: { type: Number },
    notes: { type: String },
    status: { type: String, enum: ["pending", "accepted", "rejected", "withdrawn"], default: "pending" },
  },
  baseSchemaOptions
);
addCreatedBy(JobBidSchema);

JobBidSchema.index({ job_id: 1 });
JobBidSchema.index({ subcontractor_id: 1 });

export const JobBid = models.JobBid || model<IJobBid>("JobBid", JobBidSchema);
