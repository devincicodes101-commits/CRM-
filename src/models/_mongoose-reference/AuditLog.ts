import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions } from "./baseSchema";

export interface IAuditLog extends Document {
  user_id?: string;
  user_name?: string;
  user_email?: string;
  action: "create" | "update" | "delete";
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  details?: string;
  changed_fields: string[];
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user_id: { type: String },
    user_name: { type: String },
    user_email: { type: String },
    action: { type: String, enum: ["create", "update", "delete"], required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String },
    entity_name: { type: String },
    details: { type: String },
    changed_fields: { type: [String], default: [] },
  },
  baseSchemaOptions
);

AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
AuditLogSchema.index({ created_date: -1 });

export const AuditLog = models.AuditLog || model<IAuditLog>("AuditLog", AuditLogSchema);
