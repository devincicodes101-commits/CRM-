import { Schema, type SchemaOptions } from "mongoose";

/**
 * Every entity in the original Base44 spec inherits id / created_date /
 * updated_date / created_by_id automatically. This mirrors that here so
 * individual entity schemas only need to declare their own fields.
 */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
  toJSON: {
    virtuals: true,
    transform(_doc, ret: Record<string, unknown>) {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
};

export function addCreatedBy(schema: Schema) {
  schema.add({ created_by_id: { type: String } });
}
