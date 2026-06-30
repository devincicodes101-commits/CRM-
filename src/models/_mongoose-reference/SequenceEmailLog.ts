import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";
import type { SequenceType } from "./EmailSequence";

export interface ISequenceEmailLog extends Document {
  sequence_type: SequenceType;
  step_number: number;
  step_label?: string;
  recipient_email: string;
  recipient_name?: string;
  related_id?: string;
  related_type?: "lead" | "quote" | "invoice";
  subject?: string;
  sent_date: Date;
  resend_message_id?: string;
  opened: boolean;
  opened_date?: Date;
  clicked: boolean;
  clicked_date?: Date;
  replied: boolean;
  replied_date?: Date;
  created_by_id?: string;
}

const SequenceEmailLogSchema = new Schema<ISequenceEmailLog>(
  {
    sequence_type: { type: String, enum: ["new_lead", "quote_not_booked", "invoice_not_paid"], required: true },
    step_number: { type: Number, required: true },
    step_label: { type: String },
    recipient_email: { type: String, required: true },
    recipient_name: { type: String },
    related_id: { type: String },
    related_type: { type: String, enum: ["lead", "quote", "invoice"] },
    subject: { type: String },
    sent_date: { type: Date, required: true },
    resend_message_id: { type: String },
    opened: { type: Boolean, default: false },
    opened_date: { type: Date },
    clicked: { type: Boolean, default: false },
    clicked_date: { type: Date },
    replied: { type: Boolean, default: false },
    replied_date: { type: Date },
  },
  baseSchemaOptions
);
addCreatedBy(SequenceEmailLogSchema);

SequenceEmailLogSchema.index({ related_id: 1 });
SequenceEmailLogSchema.index({ resend_message_id: 1 });

export const SequenceEmailLog =
  models.SequenceEmailLog || model<ISequenceEmailLog>("SequenceEmailLog", SequenceEmailLogSchema);
