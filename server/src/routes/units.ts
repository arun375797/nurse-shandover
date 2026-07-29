import { Router } from 'express';
import { Unit } from '../models/Unit.js';
import { noStore } from '../middleware/auth.js';

export const unitsRouter = Router();

unitsRouter.use(noStore);

unitsRouter.get('/', async (_req, res, next) => {
  try {
    const units = await Unit.find({ active: true }).sort({ name: 1 }).lean();
    res.json({
      items: units.map((unit) => ({
        id: unit._id.toString(),
        name: unit.name,
        code: unit.code,
      })),
    });
  } catch (err) {
    next(err);
  }
});
