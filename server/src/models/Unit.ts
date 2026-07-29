import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const unitSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32, unique: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type UnitDocument = InferSchemaType<typeof unitSchema> & { _id: mongoose.Types.ObjectId };

export const Unit: Model<UnitDocument> =
  mongoose.models.Unit ?? mongoose.model<UnitDocument>('Unit', unitSchema);
