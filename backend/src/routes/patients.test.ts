import { describe, it, expect } from 'vitest';
import request from 'supertest';
import {
  app,
  loginAs,
  unitId,
  nurseId,
} from '../test/setup.js';
import { PatientHandover } from '../models/PatientHandover.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { normalizeMrNumber } from '../shared/index.js';

async function authedAgent(email = 'nurse.dev@bedsiderelay.local', password = 'NurseDev!234') {
  const { agent, res } = await loginAs(email, password);
  expect(res.status).toBe(200);
  const csrf = await agent.get('/api/auth/csrf-token');
  const token = (csrf.body.csrfToken as string) || 'test-csrf';
  return { agent, token };
}

describe('Auth API', () => {
  it('logs in successfully', async () => {
    const { res } = await loginAs('nurse.dev@bedsiderelay.local', 'NurseDev!234');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('nurse.dev@bedsiderelay.local');
    expect(res.body.user.fullName).toBe('Dev Nurse');
  });

  it('rejects invalid credentials', async () => {
    const { res } = await loginAs('nurse.dev@bedsiderelay.local', 'wrong-password');
    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|NurseDev/i);
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(401);
  });
});

describe('Patients API', () => {
  it('creates a patient and emits audit event', async () => {
    const { agent, token } = await authedAgent();
    const res = await agent
      .post('/api/patients')
      .set('x-csrf-token', token)
      .send({
        patientName: 'Synthetic Patient Create',
        mrNumberDisplay: 'SYN-2001',
        shift: 'Day',
        outgoingNurse: 'Dev Nurse',
      });

    expect(res.status).toBe(201);
    expect(res.body.item.patientName).toBe('Synthetic Patient Create');
    expect(res.body.item.mrNumberDisplay).toBe('SYN-2001');
    expect(res.body.item.mrNumberNormalized).toBe(normalizeMrNumber('SYN-2001'));

    const audits = await AuditEvent.find({ action: 'create' });
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(audits[0])).not.toContain('Synthetic Patient Create');
  });

  it('rejects missing required fields', async () => {
    const { agent, token } = await authedAgent();
    const res = await agent
      .post('/api/patients')
      .set('x-csrf-token', token)
      .send({ patientName: '', mrNumberDisplay: '' });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate MR numbers in the same unit', async () => {
    const { agent, token } = await authedAgent();
    await agent
      .post('/api/patients')
      .set('x-csrf-token', token)
      .send({ patientName: 'Synthetic A', mrNumberDisplay: 'SYN-DUP' });
    const res = await agent
      .post('/api/patients')
      .set('x-csrf-token', token)
      .send({ patientName: 'Synthetic B', mrNumberDisplay: 'syn dup' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_MR');
  });

  it('lists and searches patients with pagination', async () => {
    const { agent, token } = await authedAgent();
    for (let i = 0; i < 3; i++) {
      await agent
        .post('/api/patients')
        .set('x-csrf-token', token)
        .send({
          patientName: `Synthetic Search ${i}`,
          mrNumberDisplay: `SYN-S${i}`,
        });
    }

    const list = await agent.get('/api/patients?page=1&limit=2');
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(2);
    expect(list.body.total).toBe(3);

    const search = await agent.get('/api/patients?search=SYN-S1');
    expect(search.status).toBe(200);
    expect(search.body.items).toHaveLength(1);
  });

  it('reads and updates a patient', async () => {
    const { agent, token } = await authedAgent();
    const created = await agent
      .post('/api/patients')
      .set('x-csrf-token', token)
      .send({
        patientName: 'Synthetic Edit',
        mrNumberDisplay: 'SYN-EDIT',
        pendingItems: 'Labs pending',
      });

    const id = created.body.item.id as string;
    const got = await agent.get(`/api/patients/${id}`);
    expect(got.status).toBe(200);
    expect(got.body.item.pendingItems).toBe('Labs pending');

    const updated = await agent
      .patch(`/api/patients/${id}`)
      .set('x-csrf-token', token)
      .send({
        patientName: 'Synthetic Edit',
        mrNumberDisplay: 'SYN-EDIT',
        pendingItems: 'Labs completed',
        version: 1,
        handoverStatus: 'ready',
      });

    expect(updated.status).toBe(200);
    expect(updated.body.item.pendingItems).toBe('Labs completed');
    expect(updated.body.item.version).toBe(2);
  });

  it('returns conflict on simultaneous edit', async () => {
    const { agent, token } = await authedAgent();
    const created = await agent
      .post('/api/patients')
      .set('x-csrf-token', token)
      .send({ patientName: 'Synthetic Conflict', mrNumberDisplay: 'SYN-CF' });

    const id = created.body.item.id as string;
    await agent
      .patch(`/api/patients/${id}`)
      .set('x-csrf-token', token)
      .send({
        patientName: 'Synthetic Conflict',
        mrNumberDisplay: 'SYN-CF',
        version: 1,
        handoverStatus: 'draft',
        todaysPlan: 'First save',
      });

    const stale = await agent
      .patch(`/api/patients/${id}`)
      .set('x-csrf-token', token)
      .send({
        patientName: 'Synthetic Conflict',
        mrNumberDisplay: 'SYN-CF',
        version: 1,
        handoverStatus: 'draft',
        todaysPlan: 'Stale save',
      });

    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('VERSION_CONFLICT');
  });

  it('soft archives a patient and hides from active list', async () => {
    const { agent, token } = await authedAgent();
    const created = await agent
      .post('/api/patients')
      .set('x-csrf-token', token)
      .send({ patientName: 'Synthetic Archive', mrNumberDisplay: 'SYN-ARCH' });

    const id = created.body.item.id as string;
    const archived = await agent.delete(`/api/patients/${id}`).set('x-csrf-token', token);
    expect(archived.status).toBe(200);
    expect(archived.body.item.status).toBe('archived');

    const list = await agent.get('/api/patients');
    expect(list.body.items.find((p: { id: string }) => p.id === id)).toBeUndefined();

    const stillThere = await PatientHandover.findById(id);
    expect(stillThere?.status).toBe('archived');
  });

  it('allows admin to restore an archived patient', async () => {
    const nurse = await authedAgent();
    const created = await nurse.agent
      .post('/api/patients')
      .set('x-csrf-token', nurse.token)
      .send({ patientName: 'Synthetic Restore', mrNumberDisplay: 'SYN-RES' });
    const id = created.body.item.id as string;
    await nurse.agent.delete(`/api/patients/${id}`).set('x-csrf-token', nurse.token);

    const admin = await authedAgent('admin.dev@bedsiderelay.local', 'AdminDev!234');
    const restored = await admin.agent
      .post(`/api/patients/${id}/restore`)
      .set('x-csrf-token', admin.token);
    expect(restored.status).toBe(200);
    expect(restored.body.item.status).not.toBe('archived');
  });

  it('rejects cross-unit access', async () => {
    const nurse = await authedAgent();
    const created = await nurse.agent
      .post('/api/patients')
      .set('x-csrf-token', nurse.token)
      .send({ patientName: 'Synthetic Private', mrNumberDisplay: 'SYN-PRIV' });
    const id = created.body.item.id as string;

    const other = await authedAgent('other.nurse@bedsiderelay.local', 'NurseDev!234');
    const got = await other.agent.get(`/api/patients/${id}`);
    expect(got.status).toBe(404);

    const list = await other.agent.get('/api/patients');
    expect(list.body.items.find((p: { id: string }) => p.id === id)).toBeUndefined();
  });

  it('does not leak sensitive fields in errors', async () => {
    const { agent, token } = await authedAgent();
    const res = await agent
      .post('/api/patients')
      .set('x-csrf-token', token)
      .send({ unexpected: true });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toMatch(/password|cookie|session/i);
    void unitId;
    void nurseId;
  });
});
