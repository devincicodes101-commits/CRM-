import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IInvitedUser extends Document {
  name: string;
  email: string;
  department: "telesales" | "team" | "field" | "subcontractor";
  role?: string;
  status: "pending" | "accepted";
  created_by_id?: string;
}

const InvitedUserSchema = new Schema<IInvitedUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    department: { type: String, enum: ["telesales", "team", "field", "subcontractor"], required: true },
    role: { type: String },
    status: { type: String, enum: ["pending", "accepted"], default: "pending" },
  },
  baseSchemaOptions
);
addCreatedBy(InvitedUserSchema);

export const InvitedUser =
  models.InvitedUser || model<IInvitedUser>("InvitedUser", InvitedUserSchema);
