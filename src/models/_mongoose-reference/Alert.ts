import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IAlert extends Document {
  alert_type: "low_rating" | "message" | "reminder" | "email_bounce";
  title: string;
  message: string;
  job_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  feedback_id?: string;
  star_rating?: number;
  feedback_text?: string;
  status: "active" | "resolved" | "archived";
  resolved_by?: string;
  resolved_date?: Date;
  resolution_notes?: string;
  created_by_id?: string;
}

const AlertSchema = new Schema<IAlert>(
  {
    alert_type: { type: String, enum: ["low_rating", "message", "reminder", "email_bounce"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    job_id: { type: String },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_email: { type: String },
    feedback_id: { type: String },
    star_rating: { type: Number },
    feedback_text: { type: String },
    status: { type: String, enum: ["active", "resolved", "archived"], default: "active" },
    resolved_by: { type: String },
    resolved_date: { type: Date },
    resolution_notes: { type: String },
  },
  baseSchemaOptions
);
addCreatedBy(AlertSchema);

AlertSchema.index({ status: 1, alert_type: 1 });

export const Alert = models.Alert || model<IAlert>("Alert", AlertSchema);
