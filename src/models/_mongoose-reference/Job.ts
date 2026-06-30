import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export type JobStatus =
  | "scheduled"
  | "on_hold"
  | "in_progress"
  | "invoiced"
  | "awaiting_payment"
  | "completed"
  | "cancelled";

export interface IJobMaterial {
  name: string;
  quantity: number;
  unit?: string;
  unit_cost?: number;
}

export interface IJobChecklistItem {
  label: string;
  checked: boolean;
  notes?: string;
}

export interface IClientPhoto {
  url: string;
  caption: string;
  uploaded_at: Date;
}

export interface IJob extends Document {
  title: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  quote_id?: string;
  address?: string;
  description?: string;
  start_date: Date;
  end_date?: Date;
  start_time?: string;
  end_time?: string;
  assigned_vehicle?: string;
  assigned_team?: string;
  assigned_contractor_id?: string;
  message_token: string;
  client_photos: IClientPhoto[];
  status: JobStatus;
  priority: "low" | "medium" | "high" | "urgent";
  total_value: number;
  notes?: string;
  color: string;
  reminder_24h_sent: boolean;
  completed_date?: Date;
  materials_used: IJobMaterial[];
  checklist: IJobChecklistItem[];
  check_in_time?: Date;
  check_out_time?: Date;
  check_in_lat?: number;
  check_in_lng?: number;
  arrival_confirmed: boolean;
  arrival_distance_m?: number;
  arrival_note?: string;
  site_lat?: number;
  site_lng?: number;
  created_by_id?: string;
}

const MaterialSchema = new Schema<IJobMaterial>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String },
    unit_cost: { type: Number },
  },
  { _id: false }
);

const ChecklistItemSchema = new Schema<IJobChecklistItem>(
  {
    label: { type: String, required: true },
    checked: { type: Boolean, default: false },
    notes: { type: String },
  },
  { _id: false }
);

const ClientPhotoSchema = new Schema<IClientPhoto>(
  {
    url: { type: String, required: true },
    caption: { type: String, default: "" },
    uploaded_at: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

function generateToken() {
  return [...Array(32)]
    .map(() => Math.floor(Math.random() * 36).toString(36))
    .join("");
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_email: { type: String },
    quote_id: { type: String },
    address: { type: String },
    description: { type: String },
    start_date: { type: Date, required: true },
    end_date: { type: Date },
    start_time: { type: String },
    end_time: { type: String },
    assigned_vehicle: { type: String },
    assigned_team: { type: String },
    assigned_contractor_id: { type: String },
    message_token: { type: String, default: generateToken, unique: true },
    client_photos: { type: [ClientPhotoSchema], default: [] },
    status: {
      type: String,
      enum: ["scheduled", "on_hold", "in_progress", "invoiced", "awaiting_payment", "completed", "cancelled"],
      default: "scheduled",
    },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    total_value: { type: Number, default: 0 },
    notes: { type: String },
    color: { type: String, default: "#f97316" },
    reminder_24h_sent: { type: Boolean, default: false },
    completed_date: { type: Date },
    materials_used: { type: [MaterialSchema], default: [] },
    checklist: { type: [ChecklistItemSchema], default: [] },
    check_in_time: { type: Date },
    check_out_time: { type: Date },
    check_in_lat: { type: Number },
    check_in_lng: { type: Number },
    arrival_confirmed: { type: Boolean, default: false },
    arrival_distance_m: { type: Number },
    arrival_note: { type: String },
    site_lat: { type: Number },
    site_lng: { type: Number },
  },
  baseSchemaOptions
);
addCreatedBy(JobSchema);

JobSchema.index({ start_date: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ assigned_contractor_id: 1 });

export const Job = models.Job || model<IJob>("Job", JobSchema);
