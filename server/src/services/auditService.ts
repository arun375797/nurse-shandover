import { AuditEvent } from '../models/AuditEvent.js';
import type { Types } from 'mongoose';

type AuditAction =
  | 'login'
  | 'logout'
  | 'register'
  | 'create'
  | 'update'
  | 'archive'
  | 'restore'
  | 'acknowledge';

export async function recordAudit(params: {
  actorId: Types.ObjectId | string;
  action: AuditAction;
  entityType: string;
  entityId?: Types.ObjectId | string;
  changedFieldPaths?: string[];
  requestId?: string;
}) {
  await AuditEvent.create({
    actorId: params.actorId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    changedFieldPaths: params.changedFieldPaths ?? [],
    requestId: params.requestId,
    timestamp: new Date(),
  });
}
