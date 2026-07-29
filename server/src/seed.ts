import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { Unit } from './models/Unit.js';
import { User } from './models/User.js';
import { PatientHandover } from './models/PatientHandover.js';
import { normalizeMrNumber } from '@bedsiderelay/shared';
import { safeLog } from './utils/safeLog.js';
import { seedDefaultFormOptions } from './services/formOptionService.js';

async function seed() {
  await mongoose.connect(env.mongodbUri);
  safeLog.info('Seeding database', {
    host: mongoose.connection.host,
    db: mongoose.connection.name,
  });

  let unit = await Unit.findOne({ code: 'ICU-A' });
  if (!unit) {
    unit = await Unit.create({
      name: 'Intensive Care Unit A',
      code: 'ICU-A',
      active: true,
    });
  }

  let otherUnit = await Unit.findOne({ code: 'WARD-B' });
  if (!otherUnit) {
    otherUnit = await Unit.create({
      name: 'Ward B',
      code: 'WARD-B',
      active: true,
    });
  }

  const nurseHash = await bcrypt.hash(env.seedNursePassword, 12);
  const adminHash = await bcrypt.hash(env.seedAdminPassword, 12);

  const nurse = await User.findOneAndUpdate(
    { email: 'nurse.dev@bedsiderelay.local' },
    {
      fullName: 'Dev Nurse',
      email: 'nurse.dev@bedsiderelay.local',
      passwordHash: nurseHash,
      role: 'nurse',
      unitId: unit._id,
      active: true,
    },
    { upsert: true, new: true },
  );

  await User.findOneAndUpdate(
    { email: 'admin.dev@bedsiderelay.local' },
    {
      fullName: 'Dev Admin',
      email: 'admin.dev@bedsiderelay.local',
      passwordHash: adminHash,
      role: 'admin',
      unitId: unit._id,
      active: true,
    },
    { upsert: true, new: true },
  );

  await User.findOneAndUpdate(
    { email: 'other.nurse@bedsiderelay.local' },
    {
      fullName: 'Other Unit Nurse',
      email: 'other.nurse@bedsiderelay.local',
      passwordHash: nurseHash,
      role: 'nurse',
      unitId: otherUnit._id,
      active: true,
    },
    { upsert: true, new: true },
  );

  const existing = await PatientHandover.findOne({
    unitId: unit._id,
    mrNumberNormalized: normalizeMrNumber('SYN-1001'),
  });

  if (!existing) {
    await PatientHandover.create({
      patientName: 'Synthetic Patient One',
      mrNumberDisplay: 'SYN-1001',
      mrNumberNormalized: normalizeMrNumber('SYN-1001'),
      shift: 'Day',
      ward: 'ICU',
      room: '1',
      bedNumber: 'A',
      outgoingNurse: nurse.fullName,
      handoverStatus: 'ready',
      status: 'ready',
      unitId: unit._id,
      createdBy: nurse._id,
      updatedBy: nurse._id,
      version: 1,
      assessment: { acuity: 'Medium' },
      vitalSigns: [],
      infusions: [],
      intakeOutput: [],
      diagnosticTests: [],
      bloodResults: [],
      microbiology: [],
      bloodProducts: [],
      ventilation: {},
      linesDevices: [],
    });
  }

  safeLog.info('Seed complete', {
    nurseEmail: 'nurse.dev@bedsiderelay.local',
    adminEmail: 'admin.dev@bedsiderelay.local',
  });

  await seedDefaultFormOptions();
  safeLog.info('Form options seeded');

  const resetEmail = process.env.SEED_RESET_EMAIL?.trim().toLowerCase();
  const resetPassword = process.env.SEED_RESET_PASSWORD;
  if (resetEmail && resetPassword) {
    const resetHash = await bcrypt.hash(resetPassword, 12);
    const updated = await User.findOneAndUpdate(
      { email: resetEmail },
      { passwordHash: resetHash, active: true },
      { new: true },
    );
    if (updated) {
      safeLog.info('Reset password for configured SEED_RESET_EMAIL account');
    } else {
      safeLog.warn('SEED_RESET_EMAIL account not found — no password reset applied');
    }
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  safeLog.error('Seed failed');
  console.error(err instanceof Error ? err.message : 'SeedError');
  process.exit(1);
});
