import { Router } from 'express';
import {
  normalizeMrNumber,
  objectIdSchema,
  patientHandoverWriteSchema,
  patientListQuerySchema,
  patientUpdateSchema,
} from '@bedsiderelay/shared';
import { PatientHandover } from '../models/PatientHandover.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAuth, requireRole, noStore } from '../middleware/auth.js';
import { recordAudit } from '../services/auditService.js';
import { escapeRegex, mapPatientPayload } from '../services/patientMapper.js';
import type { FilterQuery } from 'mongoose';
import mongoose from 'mongoose';

export const patientsRouter = Router();

patientsRouter.use(noStore);
patientsRouter.use(requireAuth);

function serializePatient(doc: InstanceType<typeof PatientHandover> | Record<string, unknown>) {
  const obj =
    typeof (doc as { toObject?: () => Record<string, unknown> }).toObject === 'function'
      ? (doc as { toObject: () => Record<string, unknown> }).toObject()
      : (doc as Record<string, unknown>);

  const id = String(obj._id);
  return {
    ...obj,
    id,
    _id: undefined,
    unitId: String(obj.unitId),
    createdBy: obj.createdBy ? String(obj.createdBy) : undefined,
    updatedBy: obj.updatedBy ? String(obj.updatedBy) : undefined,
    archivedBy: obj.archivedBy ? String(obj.archivedBy) : undefined,
  };
}

patientsRouter.get('/', async (req, res, next) => {
  try {
    const parsed = patientListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid query parameters.', parsed.error.flatten());
    }

    const { search, status, ward, shift, page, limit, sort } = parsed.data;
    const unitId =
      req.user!.role === 'admin' && parsed.data.unitId ? parsed.data.unitId : req.user!.unitId;

    const filter: FilterQuery<typeof PatientHandover> = {
      unitId,
    };

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'archived' };
    }

    if (ward) filter.ward = ward;
    if (shift) filter.shift = shift;

    if (search) {
      const escaped = escapeRegex(search.trim());
      const normalized = normalizeMrNumber(search);
      filter.$or = [
        { patientName: { $regex: escaped, $options: 'i' } },
        { mrNumberDisplay: { $regex: escaped, $options: 'i' } },
        { mrNumberNormalized: { $regex: `^${escapeRegex(normalized)}` } },
      ];
    }

    const sortSpec: Record<string, 1 | -1> =
      sort === 'updatedAt'
        ? { updatedAt: 1 }
        : sort === 'patientName'
          ? { patientName: 1 }
          : sort === '-patientName'
            ? { patientName: -1 }
            : { updatedAt: -1 };

    const [items, total] = await Promise.all([
      PatientHandover.find(filter)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      PatientHandover.countDocuments(filter),
    ]);

    res.json({
      items: items.map((item) => serializePatient(item)),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
});

patientsRouter.post('/', async (req, res, next) => {
  try {
    const parsed = patientHandoverWriteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid patient payload.', parsed.error.flatten());
    }

    const mrNumberNormalized = normalizeMrNumber(parsed.data.mrNumberDisplay);
    const unitId = req.user!.unitId;

    const existing = await PatientHandover.findOne({
      unitId,
      mrNumberNormalized,
      status: { $ne: 'archived' },
    }).lean();

    if (existing) {
      throw new AppError(
        409,
        'DUPLICATE_MR',
        'A patient with this MR number already exists in your unit.',
      );
    }

    const mapped = mapPatientPayload(parsed.data);
    const doc = await PatientHandover.create({
      ...mapped,
      mrNumberNormalized,
      unitId,
      status: parsed.data.handoverStatus ?? 'draft',
      createdBy: req.user!.id,
      updatedBy: req.user!.id,
      version: 1,
    });

    await recordAudit({
      actorId: req.user!.id,
      action: 'create',
      entityType: 'PatientHandover',
      entityId: doc._id,
      changedFieldPaths: ['*'],
      requestId: req.requestId,
    });

    res.status(201).json({ item: serializePatient(doc) });
  } catch (err) {
    next(err);
  }
});

patientsRouter.get('/:id', async (req, res, next) => {
  try {
    const idResult = objectIdSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid patient id.');
    }

    const doc = await PatientHandover.findOne({
      _id: idResult.data,
      unitId: req.user!.unitId,
    });

    if (!doc) {
      throw new AppError(404, 'NOT_FOUND', 'Patient not found.');
    }

    res.json({ item: serializePatient(doc) });
  } catch (err) {
    next(err);
  }
});

patientsRouter.patch('/:id', async (req, res, next) => {
  try {
    const idResult = objectIdSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid patient id.');
    }

    const parsed = patientUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid patient payload.', parsed.error.flatten());
    }

    const mrNumberNormalized = normalizeMrNumber(parsed.data.mrNumberDisplay);
    const duplicate = await PatientHandover.findOne({
      unitId: req.user!.unitId,
      mrNumberNormalized,
      status: { $ne: 'archived' },
      _id: { $ne: idResult.data },
    }).lean();

    if (duplicate) {
      throw new AppError(
        409,
        'DUPLICATE_MR',
        'A patient with this MR number already exists in your unit.',
      );
    }

    const mapped = mapPatientPayload(parsed.data);
    const updatedBy = new mongoose.Types.ObjectId(req.user!.id);
    const updated = await PatientHandover.findOneAndUpdate(
      {
        _id: idResult.data,
        unitId: req.user!.unitId,
        version: parsed.data.version,
        status: { $ne: 'archived' },
      },
      {
        $set: {
          ...mapped,
          mrNumberNormalized,
          status: parsed.data.handoverStatus,
          updatedBy,
        },
        $inc: { version: 1 },
      },
      { new: true, runValidators: true, maxTimeMS: 30000 },
    );

    if (!updated) {
      const current = await PatientHandover.findOne({
        _id: idResult.data,
        unitId: req.user!.unitId,
      }).lean();

      if (!current) {
        throw new AppError(404, 'NOT_FOUND', 'Patient not found.');
      }
      if (String(current.status) === 'archived') {
        throw new AppError(409, 'ARCHIVED', 'This patient has been archived and cannot be edited.');
      }
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Another nurse saved a newer version of this handover. Reload to review their changes before editing again.',
        { currentVersion: current.version },
      );
    }

    await recordAudit({
      actorId: req.user!.id,
      action: parsed.data.handoverStatus === 'acknowledged' ? 'acknowledge' : 'update',
      entityType: 'PatientHandover',
      entityId: updated._id,
      changedFieldPaths: Object.keys(mapped),
      requestId: req.requestId,
    });

    res.json({ item: serializePatient(updated) });
  } catch (err) {
    next(err);
  }
});

patientsRouter.delete('/:id', async (req, res, next) => {
  try {
    const idResult = objectIdSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid patient id.');
    }

    const updated = await PatientHandover.findOneAndUpdate(
      {
        _id: idResult.data,
        unitId: req.user!.unitId,
        status: { $ne: 'archived' },
      },
      {
        $set: {
          status: 'archived',
          archivedAt: new Date(),
          archivedBy: req.user!.id,
          updatedBy: req.user!.id,
        },
        $inc: { version: 1 },
      },
      { new: true },
    );

    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Patient not found or already archived.');
    }

    await recordAudit({
      actorId: req.user!.id,
      action: 'archive',
      entityType: 'PatientHandover',
      entityId: updated._id,
      requestId: req.requestId,
    });

    res.json({ item: serializePatient(updated) });
  } catch (err) {
    next(err);
  }
});

patientsRouter.post('/:id/restore', requireRole('admin'), async (req, res, next) => {
  try {
    const idResult = objectIdSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid patient id.');
    }

    const doc = await PatientHandover.findOne({
      _id: idResult.data,
      unitId: req.user!.unitId,
      status: 'archived',
    });

    if (!doc) {
      throw new AppError(404, 'NOT_FOUND', 'Archived patient not found.');
    }

    const conflict = await PatientHandover.findOne({
      unitId: req.user!.unitId,
      mrNumberNormalized: doc.mrNumberNormalized,
      status: { $ne: 'archived' },
      _id: { $ne: doc._id },
    }).lean();

    if (conflict) {
      throw new AppError(
        409,
        'DUPLICATE_MR',
        'Cannot restore: an active patient already uses this MR number.',
      );
    }

    doc.status = doc.handoverStatus ?? 'draft';
    doc.set('archivedAt', undefined);
    doc.set('archivedBy', undefined);
    doc.updatedBy = req.user!.id as unknown as typeof doc.updatedBy;
    doc.version += 1;
    await doc.save();

    await recordAudit({
      actorId: req.user!.id,
      action: 'restore',
      entityType: 'PatientHandover',
      entityId: doc._id,
      requestId: req.requestId,
    });

    res.json({ item: serializePatient(doc) });
  } catch (err) {
    next(err);
  }
});
