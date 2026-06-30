import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IInvoiceItem {
  service_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface IInvoiceAttachment {
  url: string;
  name: string;
  uploaded_date: Date;
}

export type InvoiceType = "standard" | "deposit" | "progress" | "final" | "credit_note";
export type InvoiceStatus = "draft" | "sent" | "part_paid" | "paid" | "overdue" | "cancelled";

export interface IInvoice extends Document {
  invoice_number: string;
  quote_id?: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: string;
  invoice_type: InvoiceType;
  billed_amount?: number;
  items: IInvoiceItem[];
  subtotal: number;
  discount_type: "none" | "percentage" | "fixed";
  discount_value: number;
  discount_amount: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  amount_paid: number;
  notes?: string;
  status: InvoiceStatus;
  due_date?: Date;
  sent_date?: Date;
  paid_date?: Date;
  payment_method?: "bank_transfer" | "credit_card" | "direct_debit";
  attachments: IInvoiceAttachment[];
  created_by_id?: string;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    service_name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const AttachmentSchema = new Schema<IInvoiceAttachment>(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    uploaded_date: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoice_number: { type: String, required: true, unique: true },
    quote_id: { type: String },
    customer_id: { type: String },
    customer_name: { type: String, required: true },
    customer_email: { type: String },
    customer_address: { type: String },
    invoice_type: {
      type: String,
      enum: ["standard", "deposit", "progress", "final", "credit_note"],
      default: "standard",
    },
    billed_amount: { type: Number },
    items: { type: [InvoiceItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount_type: { type: String, enum: ["none", "percentage", "fixed"], default: "none" },
    discount_value: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    vat_rate: { type: Number, default: 20 },
    vat_amount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    amount_paid: { type: Number, default: 0 },
    notes: { type: String },
    status: {
      type: String,
      enum: ["draft", "sent", "part_paid", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    due_date: { type: Date },
    sent_date: { type: Date },
    paid_date: { type: Date },
    payment_method: { type: String, enum: ["bank_transfer", "credit_card", "direct_debit"] },
    attachments: { type: [AttachmentSchema], default: [] },
  },
  baseSchemaOptions
);
addCreatedBy(InvoiceSchema);

InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ customer_id: 1 });

export const Invoice = models.Invoice || model<IInvoice>("Invoice", InvoiceSchema);
