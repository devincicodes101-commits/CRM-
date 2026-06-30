import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IQuoteItem {
  service_id?: string;
  service_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  unit_type?: string;
  total: number;
  video_url?: string;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export interface IQuote extends Document {
  quote_number: string;
  client_type: "residential" | "commercial";
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: string;
  sales_agent_id?: string;
  sales_agent_name?: string;
  items: IQuoteItem[];
  subtotal: number;
  discount_type: "none" | "percentage" | "fixed";
  discount_value: number;
  discount_amount: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  notes?: string;
  status: QuoteStatus;
  valid_until?: Date;
  template_style: "modern" | "classic" | "minimal";
  sent_date?: Date;
  discount_email_sent: boolean;
  followup_day7_sent: boolean;
  followup_day14_sent: boolean;
  reminder_date?: Date;
  reminder_time?: string;
  reminder_note?: string;
  reminder_done: boolean;
  images: string[];
  created_by_id?: string;
}

const QuoteItemSchema = new Schema<IQuoteItem>(
  {
    service_id: { type: String },
    service_name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    unit_type: { type: String },
    total: { type: Number, required: true },
    video_url: { type: String },
  },
  { _id: false }
);

const QuoteSchema = new Schema<IQuote>(
  {
    quote_number: { type: String, required: true, unique: true },
    client_type: { type: String, enum: ["residential", "commercial"], default: "residential" },
    customer_id: { type: String },
    customer_name: { type: String, required: true },
    customer_email: { type: String },
    customer_address: { type: String },
    sales_agent_id: { type: String },
    sales_agent_name: { type: String },
    items: { type: [QuoteItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount_type: { type: String, enum: ["none", "percentage", "fixed"], default: "none" },
    discount_value: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    vat_rate: { type: Number, default: 20 },
    vat_amount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notes: { type: String },
    status: { type: String, enum: ["draft", "sent", "accepted", "declined", "expired"], default: "draft" },
    valid_until: { type: Date },
    template_style: { type: String, enum: ["modern", "classic", "minimal"], default: "modern" },
    sent_date: { type: Date },
    discount_email_sent: { type: Boolean, default: false },
    followup_day7_sent: { type: Boolean, default: false },
    followup_day14_sent: { type: Boolean, default: false },
    reminder_date: { type: Date },
    reminder_time: { type: String },
    reminder_note: { type: String },
    reminder_done: { type: Boolean, default: false },
    images: { type: [String], default: [] },
  },
  baseSchemaOptions
);
addCreatedBy(QuoteSchema);

QuoteSchema.index({ status: 1 });
QuoteSchema.index({ customer_id: 1 });

export const Quote = models.Quote || model<IQuote>("Quote", QuoteSchema);
