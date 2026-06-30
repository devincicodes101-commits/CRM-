import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export type LeadSource =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "linkedin"
  | "website_form"
  | "google_ads"
  | "referral"
  | "other";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "appointment_booked"
  | "quoted"
  | "negotiation"
  | "won"
  | "lost";

export interface ILead extends Document {
  name: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  category?: "web_forms" | "social" | "ppc" | "other";
  service_interest?: string;
  message?: string;
  address?: string;
  status: LeadStatus;
  priority: "low" | "medium" | "high";
  assigned_to?: string;
  assigned_to_id?: string;
  notes?: string;
  call_notes?: string;
  follow_up_date?: Date;
  follow_up_time?: string;
  estimated_value?: number;
  converted_to_customer_id?: string;
  converted_to_quote_id?: string;
  seq_steps_sent: number[];
  consent_given: boolean;
  consent_date?: Date;
  created_by_id?: string;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String },
    source: {
      type: String,
      enum: [
        "facebook",
        "instagram",
        "tiktok",
        "twitter",
        "linkedin",
        "website_form",
        "google_ads",
        "referral",
        "other",
      ],
    },
    category: { type: String, enum: ["web_forms", "social", "ppc", "other"] },
    service_interest: { type: String },
    message: { type: String },
    address: { type: String },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "appointment_booked", "quoted", "negotiation", "won", "lost"],
      default: "new",
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    assigned_to: { type: String },
    assigned_to_id: { type: String },
    notes: { type: String },
    call_notes: { type: String },
    follow_up_date: { type: Date },
    follow_up_time: { type: String },
    estimated_value: { type: Number },
    converted_to_customer_id: { type: String },
    converted_to_quote_id: { type: String },
    seq_steps_sent: { type: [Number], default: [] },
    consent_given: { type: Boolean, default: false },
    consent_date: { type: Date },
  },
  baseSchemaOptions
);
addCreatedBy(LeadSchema);

LeadSchema.index({ status: 1, assigned_to_id: 1 });
LeadSchema.index({ name: "text", email: "text", phone: "text" });

export const Lead = models.Lead || model<ILead>("Lead", LeadSchema);
