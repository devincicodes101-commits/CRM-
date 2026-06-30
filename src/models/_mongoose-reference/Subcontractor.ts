import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface ISubcontractor extends Document {
  name: string;
  company_name?: string;
  email: string;
  phone?: string;
  covered_areas: string[];
  service_categories: string[];
  starting_postcode?: string;
  max_radius_miles?: number;
  status: "pending" | "active" | "inactive";
  rating: number;
  completed_jobs: number;
  notes?: string;
  created_by_id?: string;
}

const SubcontractorSchema = new Schema<ISubcontractor>(
  {
    name: { type: String, required: true },
    company_name: { type: String },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    covered_areas: { type: [String], default: [] },
    service_categories: { type: [String], default: [] },
    starting_postcode: { type: String },
    max_radius_miles: { type: Number },
    status: { type: String, enum: ["pending", "active", "inactive"], default: "pending" },
    rating: { type: Number, default: 0 },
    completed_jobs: { type: Number, default: 0 },
    notes: { type: String },
  },
  baseSchemaOptions
);
addCreatedBy(SubcontractorSchema);

export const Subcontractor =
  models.Subcontractor || model<ISubcontractor>("Subcontractor", SubcontractorSchema);
