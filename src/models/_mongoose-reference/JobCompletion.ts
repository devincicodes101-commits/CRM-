import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IJobCompletion extends Document {
  job_id: string;
  job_title?: string;
  customer_name: string;
  customer_email?: string;
  customer_signature?: string;
  customer_satisfaction?: "excellent" | "good" | "satisfactory" | "poor";
  customer_comments?: string;
  star_rating?: number;
  feedback?: string;
  operative_name?: string;
  completed_date?: Date;
  invoice_id?: string;
  invoice_number?: string;
  photos: string[];
  video_url?: string;
  customer_signed_off: boolean;
  thank_you_email_sent: boolean;
  created_by_id?: string;
}

const JobCompletionSchema = new Schema<IJobCompletion>(
  {
    job_id: { type: String, required: true },
    job_title: { type: String },
    customer_name: { type: String, required: true },
    customer_email: { type: String },
    customer_signature: { type: String },
    customer_satisfaction: { type: String, enum: ["excellent", "good", "satisfactory", "poor"] },
    customer_comments: { type: String },
    star_rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    operative_name: { type: String },
    completed_date: { type: Date },
    invoice_id: { type: String },
    invoice_number: { type: String },
    photos: { type: [String], default: [] },
    video_url: { type: String },
    customer_signed_off: { type: Boolean, default: false },
    thank_you_email_sent: { type: Boolean, default: false },
  },
  baseSchemaOptions
);
addCreatedBy(JobCompletionSchema);

JobCompletionSchema.index({ job_id: 1 });

export const JobCompletion =
  models.JobCompletion || model<IJobCompletion>("JobCompletion", JobCompletionSchema);
