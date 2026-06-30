import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export type SequenceType = "new_lead" | "quote_not_booked" | "invoice_not_paid";

export interface IEmailSequence extends Document {
  sequence_type: SequenceType;
  step: number;
  delay_days: number;
  subject: string;
  body: string;
  is_active: boolean;
  label?: string;
  created_by_id?: string;
}

const EmailSequenceSchema = new Schema<IEmailSequence>(
  {
    sequence_type: { type: String, enum: ["new_lead", "quote_not_booked", "invoice_not_paid"], required: true },
    step: { type: Number, required: true },
    delay_days: { type: Number, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    label: { type: String },
  },
  baseSchemaOptions
);
addCreatedBy(EmailSequenceSchema);

EmailSequenceSchema.index({ sequence_type: 1, step: 1 }, { unique: true });

export const EmailSequence =
  models.EmailSequence || model<IEmailSequence>("EmailSequence", EmailSequenceSchema);
