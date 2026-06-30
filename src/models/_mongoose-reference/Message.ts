import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IMessage extends Document {
  job_id?: string;
  quote_id?: string;
  customer_email: string;
  customer_name: string;
  subject?: string;
  content: string;
  sender_type: "customer" | "admin";
  is_read: boolean;
  status: "open" | "answered";
  conversation_id?: string;
  created_by_id?: string;
}

const MessageSchema = new Schema<IMessage>(
  {
    job_id: { type: String },
    quote_id: { type: String },
    customer_email: { type: String, required: true },
    customer_name: { type: String, required: true },
    subject: { type: String },
    content: { type: String, required: true },
    sender_type: { type: String, enum: ["customer", "admin"], required: true },
    is_read: { type: Boolean, default: false },
    status: { type: String, enum: ["open", "answered"], default: "open" },
    conversation_id: { type: String },
  },
  baseSchemaOptions
);
addCreatedBy(MessageSchema);

MessageSchema.index({ conversation_id: 1 });

export const Message = models.Message || model<IMessage>("Message", MessageSchema);
