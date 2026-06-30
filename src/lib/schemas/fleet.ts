import { z } from "zod";
import { baseSelectSchema } from "./common";

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export const vehicleInsertSchema = z.object({
  name: z.string().min(1),
  registration: z.string().min(1),
  make: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  type: z.enum(['van', 'truck', 'pickup', 'car']).default('van'),
  driver: z.string().nullable().optional(),
  status: z.enum(['active', 'idle', 'maintenance', 'repair', 'offline']).default('idle'),
  current_lat: z.number().nullable().optional(),
  current_lng: z.number().nullable().optional(),
  current_location_name: z.string().nullable().optional(),
  speed: z.number().min(0).default(0),
  last_updated: z.string().datetime().nullable().optional(),
  assigned_job: z.string().uuid().nullable().optional(),
  fuel_level: z.number().int().min(0).max(100).default(100),
  mileage: z.number().int().min(0).default(0),
  service_due_date: z.string().datetime().nullable().optional(),
  mot_due_date: z.string().datetime().nullable().optional(),
  insurance_expiry_date: z.string().datetime().nullable().optional(),
});

export const vehicleSelectSchema = baseSelectSchema.extend(vehicleInsertSchema.shape);
export const vehicleUpdateSchema = vehicleInsertSchema.partial();

export type VehicleInsert = z.infer<typeof vehicleInsertSchema>;
export type Vehicle = z.infer<typeof vehicleSelectSchema>;
export type VehicleUpdate = z.infer<typeof vehicleUpdateSchema>;

// ─── Attendance ───────────────────────────────────────────────────────────────

export const attendanceInsertSchema = z.object({
  operative_name: z.string().min(1),
  operative_id: z.string().uuid().nullable().optional(),
  attendance_date: z.string().date(),
  clock_in_time: z.string().datetime().nullable().optional(),
  clock_out_time: z.string().datetime().nullable().optional(),
  hours_worked: z.number().min(0).nullable().optional(),
  status: z.enum(['present', 'absent', 'late', 'early_leave']).default('present'),
  notes: z.string().nullable().optional(),
});

export const attendanceSelectSchema = baseSelectSchema.extend(attendanceInsertSchema.shape);
export const attendanceUpdateSchema = attendanceInsertSchema.partial();

export type AttendanceInsert = z.infer<typeof attendanceInsertSchema>;
export type Attendance = z.infer<typeof attendanceSelectSchema>;
export type AttendanceUpdate = z.infer<typeof attendanceUpdateSchema>;
