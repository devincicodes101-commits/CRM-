import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IVehicle extends Omit<Document, "model"> {
  name: string;
  registration: string;
  make?: string;
  model?: string;
  type: "van" | "truck" | "pickup" | "car";
  driver?: string;
  status: "active" | "idle" | "maintenance" | "repair" | "offline";
  current_lat?: number;
  current_lng?: number;
  current_location_name?: string;
  speed: number;
  last_updated?: Date;
  assigned_job?: string;
  fuel_level: number;
  mileage: number;
  service_due_date?: Date;
  mot_due_date?: Date;
  insurance_expiry_date?: Date;
  created_by_id?: string;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    name: { type: String, required: true },
    registration: { type: String, required: true },
    make: { type: String },
    model: { type: String },
    type: { type: String, enum: ["van", "truck", "pickup", "car"], default: "van" },
    driver: { type: String },
    status: {
      type: String,
      enum: ["active", "idle", "maintenance", "repair", "offline"],
      default: "idle",
    },
    current_lat: { type: Number },
    current_lng: { type: Number },
    current_location_name: { type: String },
    speed: { type: Number, default: 0 },
    last_updated: { type: Date },
    assigned_job: { type: String },
    fuel_level: { type: Number, default: 100 },
    mileage: { type: Number, default: 0 },
    service_due_date: { type: Date },
    mot_due_date: { type: Date },
    insurance_expiry_date: { type: Date },
  },
  baseSchemaOptions
);
addCreatedBy(VehicleSchema);

export const Vehicle = models.Vehicle || model<IVehicle>("Vehicle", VehicleSchema);
