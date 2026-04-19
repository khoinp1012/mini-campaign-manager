import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import User from '../models/User.js';
import sequelize from '../config/database.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Recipient API Hardening', () => {
  let token: string;
  let userId: number;

  beforeAll(async () => {
    // Note: Use force: true to ensure a clean slate, matching campaign.test.ts
    await sequelize.sync({ force: true });
    
    const email = `recipient-test-${Date.now()}@example.com`;
    const password = await bcrypt.hash('password123', 10);
    const user = await User.create({
      name: 'Recipient Manager',
      email,
      password,
    });
    
    userId = user.id;
    token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'supersecretkey');
  });

  it('B2.6: POST /recipients — Create new recipient', async () => {
    const res = await request(app)
      .post('/recipients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Recipient',
        email: 'new@example.com'
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Recipient');
    expect(res.body.email).toBe('new@example.com');
  });

  it('B2.5: GET /recipients — List all recipients', async () => {
    const res = await request(app)
      .get('/recipients')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((r: any) => r.email === 'new@example.com')).toBe(true);
  });

  it('API-05: GET /recipients — Boundary: Auth required', async () => {
    const res = await request(app).get('/recipients');
    expect(res.status).toBe(401);
  });

  it('API-06: POST /recipients — Valid body → 201', async () => {
    const email = `api06-${Date.now()}@test.com`;
    const res = await request(app)
      .post('/recipients')
      .set('Authorization', `Bearer ${token}`)
      .send({ email, name: 'API 06' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
  });
});
