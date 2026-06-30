import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IWebsiteDomain extends Document {
  domain_name: string;
  domain_url: string;
  status: "active" | "inactive" | "archived";
  google_analytics_id?: string;
  seo_focus_keywords: string[];
  monthly_traffic_goal?: number;
  notes?: string;
  created_date_domain?: Date;
  created_by_id?: string;
}

const WebsiteDomainSchema = new Schema<IWebsiteDomain>(
  {
    domain_name: { type: String, required: true },
    domain_url: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive", "archived"], default: "active" },
    google_analytics_id: { type: String },
    seo_focus_keywords: { type: [String], default: [] },
    monthly_traffic_goal: { type: Number },
    notes: { type: String },
    created_date_domain: { type: Date },
  },
  baseSchemaOptions
);
addCreatedBy(WebsiteDomainSchema);

export const WebsiteDomain =
  models.WebsiteDomain || model<IWebsiteDomain>("WebsiteDomain", WebsiteDomainSchema);
