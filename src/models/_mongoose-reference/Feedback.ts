import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IFeedback extends Document {
  customer_name: string;
  customer_email?: string;
  job_id?: string;
  job_title?: string;
  star_rating: number;
  feedback_text: string;
  submitted_date?: Date;
  created_by_id?: string;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    customer_name: { type: String, required: true },
    customer_email: { type: String },
    job_id: { type: String },
    job_title: { type: String },
    star_rating: { type: Number, required: true, min: 1, max: 5 },
    feedback_text: { type: String, required: true },
    submitted_date: { type: Date, default: () => new Date() },
  },
  baseSchemaOptions
);
addCreatedBy(FeedbackSchema);

export const Feedback = models.Feedback || model<IFeedback>("Feedback", FeedbackSchema);
