import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IStaffMessage extends Document {
  from_email: string;
  from_name?: string;
  to_email: string;
  subject: string;
  body: string;
  is_read: boolean;
  thread_id?: string;
  created_by_id?: string;
}

const StaffMessageSchema = new Schema<IStaffMessage>(
  {
    from_email: { type: String, required: true },
    from_name: { type: String },
    to_email: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    thread_id: { type: String },
  },
  baseSchemaOptions
);
addCreatedBy(StaffMessageSchema);

export const StaffMessage =
  models.StaffMessage || model<IStaffMessage>("StaffMessage", StaffMessageSchema);
