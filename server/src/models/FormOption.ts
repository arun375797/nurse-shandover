import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { FORM_OPTION_CATEGORY_KEYS } from '@bedsiderelay/shared';

const formOptionSchema = new Schema(
  {
    category: { type: String, enum: FORM_OPTION_CATEGORY_KEYS, required: true },
    value: { type: String, required: true, trim: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

formOptionSchema.index({ category: 1, value: 1 }, { unique: true });
formOptionSchema.index({ category: 1, sortOrder: 1, value: 1 });

export type FormOptionDocument = InferSchemaType<typeof formOptionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const FormOption: Model<FormOptionDocument> =
  mongoose.models.FormOption ??
  mongoose.model<FormOptionDocument>('FormOption', formOptionSchema);
