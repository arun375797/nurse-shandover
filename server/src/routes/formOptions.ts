import { Router } from 'express';
import { requireAuth, noStore } from '../middleware/auth.js';
import { getFormOptionsGrouped } from '../services/formOptionService.js';

export const formOptionsRouter = Router();

formOptionsRouter.use(noStore);
formOptionsRouter.use(requireAuth);

formOptionsRouter.get('/', async (_req, res, next) => {
  try {
    const options = await getFormOptionsGrouped(true);
    res.json({ options });
  } catch (err) {
    next(err);
  }
});
