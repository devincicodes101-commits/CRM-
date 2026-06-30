import { Schema, model, models, type Document } from "mongoose";
import { baseSchemaOptions, addCreatedBy } from "./baseSchema";

export interface IAttendance extends Document {
  operative_name: string;
  operative_id?: string;
  attendance_date: Date;
  clock_in_time?: Date;
  clock_out_time?: Date;
  hours_worked?: number;
  status: "present" | "absent" | "late" | "early_leave";
  notes?: string;
  created_by_id?: string;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    operative_name: { type: String, required: true },
    operative_id: { type: String },
    attendance_date: { type: Date, required: true },
    clock_in_time: { type: Date },
    clock_out_time: { type: Date },
    hours_worked: { type: Number },
    status: { type: String, enum: ["present", "absent", "late", "early_leave"], default: "present" },
    notes: { type: String },
  },
  baseSchemaOptions
);
addCreatedBy(AttendanceSchema);

AttendanceSchema.index({ operative_id: 1, attendance_date: 1 });

export const Attendance = models.Attendance || model<IAttendance>("Attendance", AttendanceSchema);
