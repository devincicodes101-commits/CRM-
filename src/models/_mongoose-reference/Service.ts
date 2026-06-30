import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export type ServiceCategory =
  | "roofing"
  | "plumbing"
  | "electrical"
  | "painting"
  | "flooring"
  | "landscaping"
  | "demolition"
  | "renovation"
  | "concrete"
  | "carpentry"
  | "insulation"
  | "asbestos"
  | "general";

export type ServiceUnitType = "per_sqm" | "per_lm" | "per_hour" | "per_day" | "fixed" | "per_unit";

export interface IService extends Document {
  name: string;
  category: ServiceCategory;
  description?: string;
  unit_price: number;
  unit_type: ServiceUnitType;
  estimated_duration?: string;
  image_url?: string;
  video_prompt?: string;
  video_url?: string;
  media_type: "ai_generated" | "uploaded" | "linked";
  is_active: boolean;
  created_by_id?: string;
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "roofing",
        "plumbing",
        "electrical",
        "painting",
        "flooring",
        "landscaping",
        "demolition",
        "renovation",
        "concrete",
        "carpentry",
        "insulation",
        "asbestos",
        "general",
      ],
      default: "general",
    },
    description: { type: String },
    unit_price: { type: Number, required: true },
    unit_type: {
      type: String,
      enum: ["per_sqm", "per_lm", "per_hour", "per_day", "fixed", "per_unit"],
      default: "fixed",
    },
    estimated_duration: { type: String },
    image_url: { type: String },
    video_prompt: { type: String },
    video_url: { type: String },
    media_type: { type: String, enum: ["ai_generated", "uploaded", "linked"], default: "ai_generated" },
    is_active: { type: Boolean, default: true },
  },
  baseSchemaOptions
);
addCreatedBy(ServiceSchema);

export const Service = models.Service || model<IService>("Service", ServiceSchema);
