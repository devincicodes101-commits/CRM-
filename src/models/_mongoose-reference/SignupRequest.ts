import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface ISignupRequest extends Document {
  operative_name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  approved_by?: string;
  approved_date?: Date;
  created_by_id?: string;
}

const SignupRequestSchema = new Schema<ISignupRequest>(
  {
    operative_name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejection_reason: { type: String },
    approved_by: { type: String },
    approved_date: { type: Date },
  },
  baseSchemaOptions
);
addCreatedBy(SignupRequestSchema);

export const SignupRequest =
  models.SignupRequest || model<ISignupRequest>("SignupRequest", SignupRequestSchema);
