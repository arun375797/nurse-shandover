import { Router } from 'express';
import { formOptionCreateSchema, formOptionUpdateSchema } from '@bedsiderelay/shared';
import { FormOption } from '../../models/FormOption.js';
import { AppError } from '../../middleware/errorHandler.js';
import { requireAuth, requireRole, noStore } from '../../middleware/auth.js';
import { getFormOptionsAdmin } from '../../services/formOptionService.js';
import { recordAudit } from '../../services/auditService.js';

export const adminFormOptionsRouter = Router();

adminFormOptionsRouter.use(noStore);
adminFormOptionsRouter.use(requireAuth, requireRole('admin'));

adminFormOptionsRouter.get('/', async (_req, res, next) => {
  try {
    const items = await getFormOptionsAdmin();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

adminFormOptionsRouter.post('/', async (req, res, next) => {
  try {
    const parsed = formOptionCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid payload.', parsed.error.flatten());
    }

    const existing = await FormOption.findOne({
      category: parsed.data.category,
      value: parsed.data.value,
    });
    if (existing) {
      throw new AppError(409, 'DUPLICATE', 'This option already exists in the category.');
    }

    const option = await FormOption.create({
      category: parsed.data.category,
      value: parsed.data.value,
      sortOrder: parsed.data.sortOrder ?? 0,
      active: true,
    });

    await recordAudit({
      actorId: req.user!.id,
      action: 'create',
      entityType: 'FormOption',
      entityId: option._id,
      requestId: req.requestId,
    });

    res.status(201).json({
      item: {
        id: option._id.toString(),
        category: option.category,
        value: option.value,
        sortOrder: option.sortOrder,
        active: option.active,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminFormOptionsRouter.patch('/:id', async (req, res, next) => {
  try {
    const parsed = formOptionUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid payload.', parsed.error.flatten());
    }

    const option = await FormOption.findById(req.params.id);
    if (!option) {
      throw new AppError(404, 'NOT_FOUND', 'Form option not found.');
    }

    if (parsed.data.value !== undefined && parsed.data.value !== option.value) {
      const duplicate = await FormOption.findOne({
        category: option.category,
        value: parsed.data.value,
        _id: { $ne: option._id },
      });
      if (duplicate) {
        throw new AppError(409, 'DUPLICATE', 'This option already exists in the category.');
      }
      option.value = parsed.data.value;
    }

    if (parsed.data.sortOrder !== undefined) option.sortOrder = parsed.data.sortOrder;
    if (parsed.data.active !== undefined) option.active = parsed.data.active;

    await option.save();

    await recordAudit({
      actorId: req.user!.id,
      action: 'update',
      entityType: 'FormOption',
      entityId: option._id,
      changedFieldPaths: Object.keys(parsed.data),
      requestId: req.requestId,
    });

    res.json({
      item: {
        id: option._id.toString(),
        category: option.category,
        value: option.value,
        sortOrder: option.sortOrder,
        active: option.active,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminFormOptionsRouter.delete('/:id', async (req, res, next) => {
  try {
    const option = await FormOption.findByIdAndDelete(req.params.id);
    if (!option) {
      throw new AppError(404, 'NOT_FOUND', 'Form option not found.');
    }

    await recordAudit({
      actorId: req.user!.id,
      action: 'archive',
      entityType: 'FormOption',
      entityId: option._id,
      requestId: req.requestId,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
