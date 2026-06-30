import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions } from "./baseSchema";

export type UserRole = "admin" | "user" | "operative" | "sales" | "telesales" | "contractor";

export interface IUser extends Document {
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  avatar_url?: string;
  nav_permissions: string[];
  mobile_number?: string;
  created_date: Date;
  updated_date: Date;
}

const UserSchema = new Schema<IUser>(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "user", "operative", "sales", "telesales", "contractor"],
      default: "user",
    },
    avatar_url: { type: String },
    nav_permissions: { type: [String], default: [] },
    mobile_number: { type: String },
  },
  baseSchemaOptions
);

export const User = models.User || model<IUser>("User", UserSchema);
