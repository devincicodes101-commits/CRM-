import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IInternalChat extends Document {
  channel: string;
  sender_id: string;
  sender_name: string;
  sender_role?: string;
  sender_avatar?: string;
  message: string;
  is_read_by: string[];
  created_by_id?: string;
}

const InternalChatSchema = new Schema<IInternalChat>(
  {
    channel: { type: String, required: true },
    sender_id: { type: String, required: true },
    sender_name: { type: String, required: true },
    sender_role: { type: String },
    sender_avatar: { type: String },
    message: { type: String, required: true },
    is_read_by: { type: [String], default: [] },
  },
  baseSchemaOptions
);
addCreatedBy(InternalChatSchema);

InternalChatSchema.index({ channel: 1, created_date: 1 });

export const InternalChat =
  models.InternalChat || model<IInternalChat>("InternalChat", InternalChatSchema);
