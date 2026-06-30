import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IIntegrationCredentials {
  api_key?: string;
  api_secret?: string;
  client_id?: string;
  client_secret?: string;
  publishable_key?: string;
  phone_number_id?: string;
  access_token?: string;
}

export interface IIntegrationConnection extends Document {
  integration_key: string;
  integration_name: string;
  category: "Communications" | "Accounting" | "Payments" | "Calendar" | "Maps";
  is_connected: boolean;
  credentials?: IIntegrationCredentials;
  connected_date?: Date;
  disconnected_date?: Date;
  created_by_id?: string;
}

const IntegrationConnectionSchema = new Schema<IIntegrationConnection>(
  {
    integration_key: { type: String, required: true, unique: true },
    integration_name: { type: String, required: true },
    category: {
      type: String,
      enum: ["Communications", "Accounting", "Payments", "Calendar", "Maps"],
      required: true,
    },
    is_connected: { type: Boolean, default: false },
    credentials: {
      api_key: String,
      api_secret: String,
      client_id: String,
      client_secret: String,
      publishable_key: String,
      phone_number_id: String,
      access_token: String,
    },
    connected_date: { type: Date },
    disconnected_date: { type: Date },
  },
  baseSchemaOptions
);
addCreatedBy(IntegrationConnectionSchema);

export const IntegrationConnection =
  models.IntegrationConnection ||
  model<IIntegrationConnection>("IntegrationConnection", IntegrationConnectionSchema);
