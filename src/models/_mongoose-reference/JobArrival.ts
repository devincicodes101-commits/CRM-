import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IJobArrival extends Document {
  job_id: string;
  vehicle_id: string;
  arrival_lat: number;
  arrival_lng: number;
  arrival_time: Date;
  invoice_sent: boolean;
  created_by_id?: string;
}

const JobArrivalSchema = new Schema<IJobArrival>(
  {
    job_id: { type: String, required: true },
    vehicle_id: { type: String, required: true },
    arrival_lat: { type: Number, required: true },
    arrival_lng: { type: Number, required: true },
    arrival_time: { type: Date, required: true },
    invoice_sent: { type: Boolean, default: false },
  },
  baseSchemaOptions
);
addCreatedBy(JobArrivalSchema);

JobArrivalSchema.index({ job_id: 1 });

export const JobArrival = models.JobArrival || model<IJobArrival>("JobArrival", JobArrivalSchema);
