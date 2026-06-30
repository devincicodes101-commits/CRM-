import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IReceipt extends Document {
  job_id: string;
  operative_name: string;
  photo_url: string;
  amount_gbp?: number;
  item_description?: string;
  purchase_date?: Date;
  notes?: string;
  status: "pending" | "approved" | "rejected";
  created_by_id?: string;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    job_id: { type: String, required: true },
    operative_name: { type: String, required: true },
    photo_url: { type: String, required: true },
    amount_gbp: { type: Number },
    item_description: { type: String },
    purchase_date: { type: Date },
    notes: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  baseSchemaOptions
);
addCreatedBy(ReceiptSchema);

ReceiptSchema.index({ job_id: 1 });

export const Receipt = models.Receipt || model<IReceipt>("Receipt", ReceiptSchema);
