import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface ICompanySettings extends Document {
  company_name?: string;
  tagline?: string;
  email?: string;
  sender_email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  website?: string;
  base_url?: string;
  vat_number?: string;
  company_number?: string;
  logo_url?: string;
  primary_color: string;
  quote_footer_text?: string;
  invoice_footer_text?: string;
  bank_account_name?: string;
  bank_sort_code?: string;
  bank_account_number?: string;
  terms_and_conditions?: string;
  role_permissions: Record<string, string[]>;
  opening_time: string;
  closing_time: string;
  working_days: number[];
  business_timezone: string;
  default_labour_rate?: number;
  monthly_marketing_spend?: number;
  new_lead_sequence_start_date?: Date;
  created_by_id?: string;
}

const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    company_name: { type: String },
    tagline: { type: String },
    email: { type: String },
    sender_email: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    postcode: { type: String },
    website: { type: String },
    base_url: { type: String },
    vat_number: { type: String },
    company_number: { type: String },
    logo_url: { type: String },
    primary_color: { type: String, default: "#f97316" },
    quote_footer_text: { type: String },
    invoice_footer_text: { type: String },
    bank_account_name: { type: String },
    bank_sort_code: { type: String },
    bank_account_number: { type: String },
    terms_and_conditions: { type: String },
    role_permissions: { type: Schema.Types.Mixed, default: {} },
    opening_time: { type: String, default: "09:00" },
    closing_time: { type: String, default: "17:30" },
    working_days: { type: [Number], default: [1, 2, 3, 4, 5] },
    business_timezone: { type: String, default: "Europe/London" },
    default_labour_rate: { type: Number },
    monthly_marketing_spend: { type: Number },
    new_lead_sequence_start_date: { type: Date },
  },
  baseSchemaOptions
);
addCreatedBy(CompanySettingsSchema);

export const CompanySettings =
  models.CompanySettings || model<ICompanySettings>("CompanySettings", CompanySettingsSchema);
