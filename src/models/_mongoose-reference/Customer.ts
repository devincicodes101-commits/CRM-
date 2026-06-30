import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface ICustomerReview {
  rating: number;
  feedback?: string;
  job_title?: string;
  date?: Date;
}

export interface ICustomer extends Document {
  name: string;
  company?: string;
  email?: string;
  email_status: "valid" | "bounced" | "complained";
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  notes?: string;
  status: "lead" | "active" | "inactive";
  client_type: "domestic" | "commercial";
  total_spent: number;
  reviews: ICustomerReview[];
  average_rating?: number;
  created_by_id?: string;
}

const ReviewSchema = new Schema<ICustomerReview>(
  {
    rating: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String },
    job_title: { type: String },
    date: { type: Date },
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    company: { type: String },
    email: { type: String, lowercase: true, trim: true },
    email_status: { type: String, enum: ["valid", "bounced", "complained"], default: "valid" },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    postcode: { type: String },
    notes: { type: String },
    status: { type: String, enum: ["lead", "active", "inactive"], default: "lead" },
    client_type: { type: String, enum: ["domestic", "commercial"], default: "domestic" },
    total_spent: { type: Number, default: 0 },
    reviews: { type: [ReviewSchema], default: [] },
    average_rating: { type: Number },
  },
  baseSchemaOptions
);
addCreatedBy(CustomerSchema);

CustomerSchema.index({ email: 1 });
CustomerSchema.index({ name: "text", company: "text" });

export const Customer = models.Customer || model<ICustomer>("Customer", CustomerSchema);
