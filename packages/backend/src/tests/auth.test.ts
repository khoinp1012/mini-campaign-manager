import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import sequelize from '../config/database.js';
import User from '../models/User.js';

describe('Auth API Integration', () => {
  const testUser = {
    name: 'Auth Test User',
    email: `auth-${Date.now()}@test.com`,
    password: 'securepassword123',
  };

  beforeAll(async () => {
    // Ensure clean state for auth tests
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('API-01: POST /auth/register — Valid payload → 201', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('API-02: POST /auth/login — Valid credentials → 200 + httpOnly cookie set', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('token');
    expect(res.headers['set-cookie']).toBeDefined();
    const cookieHeader = res.headers['set-cookie'][0];
    expect(cookieHeader).toContain('token=');
    expect(cookieHeader).toContain('HttpOnly');
  });

  it('API-03: POST /auth/login — Boundary: Invalid password → 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid credentials/i);
  });

  it('API-01b: POST /auth/register — Sets httpOnly cookie', async () => {
    const newUser = {
      name: 'Cookie Test',
      email: `cookie-${Date.now()}@test.com`,
      password: 'securepassword123',
    };
    const res = await request(app)
      .post('/auth/register')
      .send(newUser);

    expect(res.status).toBe(201);
    expect(res.headers['set-cookie']).toBeDefined();
    const cookieHeader = res.headers['set-cookie'][0];
    expect(cookieHeader).toContain('token=');
    expect(cookieHeader).toContain('HttpOnly');
  });

  it('API-02b: Authenticated request via cookie — Cookie sent, request succeeds', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

    const res = await request(app)
      .get('/campaigns')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
  });

  it('API-02c: Authenticated request via cookie — Invalid cookie returns 401', async () => {
    const res = await request(app)
      .get('/campaigns')
      .set('Cookie', 'token=invalid-token');

    expect(res.status).toBe(401);
  });

  it('API-04: POST /auth/logout — Clears cookie', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

    const logoutRes = await request(app)
      .post('/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers['set-cookie']).toBeDefined();
    const logoutCookie = logoutRes.headers['set-cookie'][0];
    expect(logoutCookie).toContain('token=;');
  });

  it('SEC-01: Cookie security — httpOnly prevents JavaScript access', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const cookieHeader = res.headers['set-cookie'][0];
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toMatch(/HttpOnly[;=]/i);
  });

  it('SEC-02: Cookie security — SameSite lax for CSRF protection', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const cookieHeader = res.headers['set-cookie'][0];
    expect(cookieHeader).toContain('SameSite=Lax');
  });

  it('SEC-03: Cookie security — Secure flag in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const cookieHeader = res.headers['set-cookie'][0];
    expect(cookieHeader).toContain('Secure');

    process.env.NODE_ENV = originalEnv;
  });

  it('SEC-04: Cookie security — HttpOnly means no token in response body', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.body).not.toHaveProperty('token');
    expect(res.body).not.toHaveProperty('token', expect.any(String));
    expect(res.headers['set-cookie'][0]).toContain('token=');
  });

  it('SESSION-01: GET /auth/me — Returns user data when authenticated via cookie', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

    const meRes = await request(app)
      .get('/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toHaveProperty('id');
    expect(meRes.body).toHaveProperty('email', testUser.email);
    expect(meRes.body).toHaveProperty('name');
    expect(meRes.body).not.toHaveProperty('password');
  });

  it('SESSION-02: GET /auth/me — Returns 401 when no cookie provided', async () => {
    const res = await request(app)
      .get('/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/No token provided/i);
  });

  it('SESSION-03: GET /auth/me — Returns 401 when invalid cookie', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', 'token=invalid-token');

    expect(res.status).toBe(401);
  });
});
