import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../test/setup.js';

describe('auth registration', () => {
  it('lists active units without authentication', async () => {
    const res = await request(app).get('/api/units');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      code: expect.any(String),
    });
  });

  it('registers a new nurse and allows sign in', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      fullName: 'New Nurse',
      email: 'new.nurse@example.com',
      unitName: 'ICU A',
      password: 'SecurePass!234',
      confirmPassword: 'SecurePass!234',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.message).toMatch(/sign in/i);
    expect(registerRes.body.user.email).toBe('new.nurse@example.com');

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'new.nurse@example.com',
      password: 'SecurePass!234',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.fullName).toBe('New Nurse');
    expect(loginRes.body.user.role).toBe('nurse');
  });

  it('rejects duplicate email registration', async () => {
    const payload = {
      fullName: 'Duplicate Nurse',
      email: 'nurse.dev@bedsiderelay.local',
      unitName: 'ICU A',
      password: 'SecurePass!234',
      confirmPassword: 'SecurePass!234',
    };

    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('creates a new unit when a custom unit name is entered', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Custom Unit Nurse',
      email: 'custom.unit@example.com',
      unitName: 'Cardiology Ward',
      password: 'SecurePass!234',
      confirmPassword: 'SecurePass!234',
    });

    expect(registerRes.status).toBe(201);

    const unitsRes = await request(app).get('/api/units');
    expect(unitsRes.body.items.some((unit: { name: string }) => unit.name === 'Cardiology Ward')).toBe(
      true,
    );
  });

  it('rejects mismatched passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Bad Password Nurse',
      email: 'bad.password@example.com',
      unitName: 'ICU A',
      password: 'SecurePass!234',
      confirmPassword: 'DifferentPass!234',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });
});
