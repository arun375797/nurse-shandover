import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const auditEventSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['login', 'logout', 'register', 'create', 'update', 'archive', 'restore', 'acknowledge'],
      required: true,
    },
    entityType: { type: String, required: true, maxlength: 64 },
    entityId: { type: Schema.Types.ObjectId },
    changedFieldPaths: [{ type: String, maxlength: 200 }],
    requestId: { type: String, maxlength: 64 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

auditEventSchema.index({ timestamp: -1 });
auditEventSchema.index({ entityType: 1, entityId: 1 });

export type AuditEventDocument = InferSchemaType<typeof auditEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditEvent: Model<AuditEventDocument> =
  mongoose.models.AuditEvent ??
  mongoose.model<AuditEventDocument>('AuditEvent', auditEventSchema);
