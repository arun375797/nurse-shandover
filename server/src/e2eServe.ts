import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import { createApp } from './app.js';
import { Unit } from './models/Unit.js';
import { User } from './models/User.js';
import { env } from './config/env.js';

async function main() {
  process.env.NODE_ENV = 'test';
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);

  const unit = await Unit.create({ name: 'ICU A', code: 'ICU-A', active: true });
  const hash = await bcrypt.hash(env.seedNursePassword, 4);
  const adminHash = await bcrypt.hash(env.seedAdminPassword, 4);

  await User.create({
    fullName: 'Dev Nurse',
    email: 'nurse.dev@bedsiderelay.local',
    passwordHash: hash,
    role: 'nurse',
    unitId: unit._id,
    active: true,
  });

  await User.create({
    fullName: 'Dev Admin',
    email: 'admin.dev@bedsiderelay.local',
    passwordHash: adminHash,
    role: 'admin',
    unitId: unit._id,
    active: true,
  });

  const app = createApp(uri);
  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, '127.0.0.1', () => {
    console.info(`[e2e] API ready on ${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
