import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app, adminId, nurseId, loginAs } from '../../test/setup.js';
import { AuditEvent } from '../../models/AuditEvent.js';
import mongoose from 'mongoose';

describe('admin users', () => {
  beforeEach(async () => {
    await AuditEvent.create([
      {
        actorId: new mongoose.Types.ObjectId(nurseId),
        action: 'login',
        entityType: 'User',
        entityId: new mongoose.Types.ObjectId(nurseId),
        timestamp: new Date(),
      },
      {
        actorId: new mongoose.Types.ObjectId(nurseId),
        action: 'create',
        entityType: 'PatientHandover',
        timestamp: new Date(),
      },
    ]);
  });

  it('rejects non-admin access to user list', async () => {
    const { agent, token } = await loginAs('nurse.dev@bedsiderelay.local', 'NurseDev!234');
    const res = await agent
      .get('/api/admin/users')
      .set('x-csrf-token', token || 'test');
    expect(res.status).toBe(403);
  });

  it('lists users with usage stats and no patient data', async () => {
    const { agent, token } = await loginAs('admin.dev@bedsiderelay.local', 'AdminDev!234');
    const res = await agent
      .get('/api/admin/users')
      .set('x-csrf-token', token || 'test');

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(3);

    const nurse = res.body.items.find((u: { email: string }) => u.email === 'nurse.dev@bedsiderelay.local');
    expect(nurse).toMatchObject({
      fullName: 'Dev Nurse',
      role: 'nurse',
      active: true,
      usage: {
        loginCount: 1,
        handoverCreateCount: 1,
        handoverUpdateCount: 0,
      },
    });
    expect(nurse).not.toHaveProperty('patientName');
    expect(nurse).not.toHaveProperty('mrNumberDisplay');
  });

  it('blocks and unblocks a user', async () => {
    const { agent, token } = await loginAs('admin.dev@bedsiderelay.local', 'AdminDev!234');

    const blockRes = await agent
      .patch(`/api/admin/users/${nurseId}`)
      .set('x-csrf-token', token || 'test')
      .send({ active: false });
    expect(blockRes.status).toBe(200);
    expect(blockRes.body.item.active).toBe(false);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'nurse.dev@bedsiderelay.local',
      password: 'NurseDev!234',
    });
    expect(loginRes.status).toBe(401);

    const unblockRes = await agent
      .patch(`/api/admin/users/${nurseId}`)
      .set('x-csrf-token', token || 'test')
      .send({ active: true });
    expect(unblockRes.status).toBe(200);
    expect(unblockRes.body.item.active).toBe(true);
  });

  it('prevents admin from blocking themselves', async () => {
    const { agent, token } = await loginAs('admin.dev@bedsiderelay.local', 'AdminDev!234');
    const res = await agent
      .patch(`/api/admin/users/${adminId}`)
      .set('x-csrf-token', token || 'test')
      .send({ active: false });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('SELF_BLOCK');
  });
});

describe('admin form options', () => {
  it('allows nurses to read active form options', async () => {
    const { agent, token } = await loginAs('nurse.dev@bedsiderelay.local', 'NurseDev!234');
    const res = await agent
      .get('/api/form-options')
      .set('x-csrf-token', token || 'test');

    expect(res.status).toBe(200);
    expect(res.body.options.diagnostic_test).toContain('X-ray');
    expect(res.body.options.blood_result_test).toContain('CBC');
  });

  it('allows admin to add, edit, and delete form options', async () => {
    const { agent, token } = await loginAs('admin.dev@bedsiderelay.local', 'AdminDev!234');

    const createRes = await agent
      .post('/api/admin/form-options')
      .set('x-csrf-token', token || 'test')
      .send({ category: 'diagnostic_test', value: 'PET Scan' });
    expect(createRes.status).toBe(201);
    const optionId = createRes.body.item.id;

    const listRes = await agent
      .get('/api/admin/form-options')
      .set('x-csrf-token', token || 'test');
    expect(listRes.body.items.some((o: { value: string }) => o.value === 'PET Scan')).toBe(true);

    const updateRes = await agent
      .patch(`/api/admin/form-options/${optionId}`)
      .set('x-csrf-token', token || 'test')
      .send({ value: 'PET-CT Scan' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.item.value).toBe('PET-CT Scan');

    const deleteRes = await agent
      .delete(`/api/admin/form-options/${optionId}`)
      .set('x-csrf-token', token || 'test');
    expect(deleteRes.status).toBe(200);
  });

  it('rejects nurse access to admin form options', async () => {
    const { agent, token } = await loginAs('nurse.dev@bedsiderelay.local', 'NurseDev!234');
    const res = await agent
      .post('/api/admin/form-options')
      .set('x-csrf-token', token || 'test')
      .send({ category: 'diagnostic_test', value: 'Forbidden Test' });
    expect(res.status).toBe(403);
  });
});
