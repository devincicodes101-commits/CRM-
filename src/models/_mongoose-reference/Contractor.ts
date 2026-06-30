import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IContractor extends Document {
  user_id?: string;
  company_name?: string;
  contact_name: string;
  email: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  address_city?: string;
  address_postcode?: string;
  bank_account_name?: string;
  bank_sort_code?: string;
  bank_account_number?: string;
  vat_registered: boolean;
  vat_number?: string;
  registration_completed: boolean;
  created_by_id?: string;
}

const ContractorSchema = new Schema<IContractor>(
  {
    user_id: { type: String },
    company_name: { type: String },
    contact_name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    address_line1: { type: String },
    address_line2: { type: String },
    address_city: { type: String },
    address_postcode: { type: String },
    bank_account_name: { type: String },
    bank_sort_code: { type: String },
    bank_account_number: { type: String },
    vat_registered: { type: Boolean, default: false },
    vat_number: { type: String },
    registration_completed: { type: Boolean, default: false },
  },
  baseSchemaOptions
);
addCreatedBy(ContractorSchema);

ContractorSchema.index({ user_id: 1 });
ContractorSchema.index({ email: 1 });

export const Contractor = models.Contractor || model<IContractor>("Contractor", ContractorSchema);
