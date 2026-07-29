process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-at-least-32-characters';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.APP_TIMEZONE = 'UTC';
process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/bedsiderelay-test';

import { beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import { Unit } from '../models/Unit.js';
import { User } from '../models/User.js';
import { PatientHandover } from '../models/PatientHandover.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { FormOption } from '../models/FormOption.js';
import { createApp } from '../app.js';
import { seedDefaultFormOptions } from '../services/formOptionService.js';
import type { Express } from 'express';

let mongo: MongoMemoryServer;
export let app: Express;
export let unitId = '';
export let otherUnitId = '';
export let nurseId = '';
export let adminId = '';

export async function loginAs(email: string, password: string) {
  const agent = (await import('supertest')).default.agent(app);
  const csrf = await agent.get('/api/auth/csrf-token');
  const token = csrf.body.csrfToken as string;
  const res = await agent
    .post('/api/auth/login')
    .set('x-csrf-token', token || 'test')
    .send({ email, password });
  return { agent, token, res };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
  app = createApp(uri);
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Unit.deleteMany({}),
    PatientHandover.deleteMany({}),
    AuditEvent.deleteMany({}),
    FormOption.deleteMany({}),
  ]);

  const unit = await Unit.create({ name: 'ICU A', code: 'ICU-A', active: true });
  const other = await Unit.create({ name: 'Ward B', code: 'WARD-B', active: true });
  unitId = unit._id.toString();
  otherUnitId = other._id.toString();

  const hash = await bcrypt.hash('NurseDev!234', 4);
  const adminHash = await bcrypt.hash('AdminDev!234', 4);

  const nurse = await User.create({
    fullName: 'Dev Nurse',
    email: 'nurse.dev@bedsiderelay.local',
    passwordHash: hash,
    role: 'nurse',
    unitId: unit._id,
    active: true,
  });
  nurseId = nurse._id.toString();

  const admin = await User.create({
    fullName: 'Dev Admin',
    email: 'admin.dev@bedsiderelay.local',
    passwordHash: adminHash,
    role: 'admin',
    unitId: unit._id,
    active: true,
  });
  adminId = admin._id.toString();

  await User.create({
    fullName: 'Other Nurse',
    email: 'other.nurse@bedsiderelay.local',
    passwordHash: hash,
    role: 'nurse',
    unitId: other._id,
    active: true,
  });

  await seedDefaultFormOptions();
});
