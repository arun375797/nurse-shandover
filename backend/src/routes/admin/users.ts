import { Router } from 'express';
import mongoose from 'mongoose';
import { adminUserUpdateSchema } from '../../shared/index.js';
import { User } from '../../models/User.js';
import { AuditEvent } from '../../models/AuditEvent.js';
import { AppError } from '../../middleware/errorHandler.js';
import { requireAuth, requireRole, noStore } from '../../middleware/auth.js';
import { recordAudit } from '../../services/auditService.js';

export const adminUsersRouter = Router();

adminUsersRouter.use(noStore);
adminUsersRouter.use(requireAuth, requireRole('admin'));

adminUsersRouter.get('/', async (_req, res, next) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .populate('unitId', 'name code')
      .lean();

    const userIds = users.map((u) => u._id);

    const usageAgg = await AuditEvent.aggregate<{
      _id: mongoose.Types.ObjectId;
      loginCount: number;
      createCount: number;
      updateCount: number;
      acknowledgeCount: number;
      lastActivityAt: Date;
    }>([
      { $match: { actorId: { $in: userIds } } },
      {
        $group: {
          _id: '$actorId',
          loginCount: {
            $sum: { $cond: [{ $eq: ['$action', 'login'] }, 1, 0] },
          },
          createCount: {
            $sum: { $cond: [{ $eq: ['$action', 'create'] }, 1, 0] },
          },
          updateCount: {
            $sum: { $cond: [{ $eq: ['$action', 'update'] }, 1, 0] },
          },
          acknowledgeCount: {
            $sum: { $cond: [{ $eq: ['$action', 'acknowledge'] }, 1, 0] },
          },
          lastActivityAt: { $max: '$timestamp' },
        },
      },
    ]);

    const usageByUser = new Map(usageAgg.map((row) => [row._id.toString(), row]));

    res.json({
      items: users.map((user) => {
        const unit = user.unitId as { _id?: mongoose.Types.ObjectId; name?: string; code?: string } | null;
        const usage = usageByUser.get(user._id.toString());

        return {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          active: user.active,
          unit: unit?.name
            ? { id: unit._id?.toString() ?? '', name: unit.name, code: unit.code ?? '' }
            : null,
          lastLoginAt: user.lastLoginAt ?? null,
          createdAt: user.createdAt,
          usage: {
            loginCount: usage?.loginCount ?? 0,
            handoverCreateCount: usage?.createCount ?? 0,
            handoverUpdateCount: usage?.updateCount ?? 0,
            acknowledgeCount: usage?.acknowledgeCount ?? 0,
            lastActivityAt: usage?.lastActivityAt ?? null,
          },
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

adminUsersRouter.patch('/:id', async (req, res, next) => {
  try {
    const parsed = adminUserUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION', 'Invalid payload.', parsed.error.flatten());
    }

    if (req.params.id === req.user!.id && parsed.data.active === false) {
      throw new AppError(400, 'SELF_BLOCK', 'You cannot block your own account.');
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: parsed.data.active },
      { new: true },
    )
      .populate('unitId', 'name code')
      .lean();

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    await recordAudit({
      actorId: req.user!.id,
      action: 'update',
      entityType: 'User',
      entityId: user._id,
      changedFieldPaths: ['active'],
      requestId: req.requestId,
    });

    const unit = user.unitId as { _id?: mongoose.Types.ObjectId; name?: string; code?: string } | null;

    res.json({
      item: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        active: user.active,
        unit: unit?.name
          ? { id: unit._id?.toString() ?? '', name: unit.name, code: unit.code ?? '' }
          : null,
        lastLoginAt: user.lastLoginAt ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});
