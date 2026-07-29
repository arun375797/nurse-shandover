import { Router } from 'express';
import { adminUsersRouter } from './users.js';
import { adminFormOptionsRouter } from './formOptions.js';

export const adminRouter = Router();

adminRouter.use('/users', adminUsersRouter);
adminRouter.use('/form-options', adminFormOptionsRouter);
