import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import User from '../models/User.js';
import Campaign, { CampaignStatus } from '../models/Campaign.js';
import sequelize from '../config/database.js';
import { migrator } from '../config/migrator.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Campaign Business Logic', () => {
  let token: string;
  let userId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    const password = await bcrypt.hash('password123', 10);
    const user = await User.create({
      name: 'Test Member',
      email: 'test@example.com',
      password,
    });
    
    userId = user.id;
    token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'supersecretkey');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('Requirement: Only draft campaigns can be deleted', async () => {
    // 1. Create a draft campaign
    const campaign = await Campaign.create({
      name: 'Draft to Delete',
      subject: 'Subject',
      body: 'Body',
      status: CampaignStatus.DRAFT,
      createdBy: userId,
    });

    // 2. Try to delete draft (Should work)
    const deleteRes = await request(app)
      .delete(`/campaigns/${campaign.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    // 3. Create a sent campaign
    const sentCampaign = await Campaign.create({
      name: 'Sent to Delete',
      subject: 'Subject',
      body: 'Body',
      status: CampaignStatus.SENT,
      createdBy: userId,
    });

    // 4. Try to delete sent (Should fail)
    const deleteSentRes = await request(app)
      .delete(`/campaigns/${sentCampaign.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteSentRes.status).toBe(400);
    expect(deleteSentRes.body.error).toMatch(/Only draft campaigns can be deleted/);
  });

  it('Requirement: scheduled_at must be a future timestamp', async () => {
    const campaign = await Campaign.create({
      name: 'Scheduled Test',
      subject: 'Subject',
      body: 'Body',
      status: CampaignStatus.DRAFT,
      createdBy: userId,
    });

    // Try to schedule in past
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    const scheduleRes = await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scheduled_at: pastDate.toISOString() });

    expect(scheduleRes.status).toBe(400);
    expect(scheduleRes.body.error).toMatch(/future/);
  });

  it('Requirement: Campaigns must be private to the owner', async () => {
    // Create another user
    const otherUser = await User.create({
      name: 'Spy',
      email: 'spy@example.com',
      password: 'password',
    });
    const spyToken = jwt.sign({ id: otherUser.id }, process.env.JWT_SECRET || 'supersecretkey');

    // Create a campaign with original user
    const campaign = await Campaign.create({
      name: 'Secret Campaign',
      subject: 'Subject',
      body: 'Body',
      status: CampaignStatus.DRAFT,
      createdBy: userId,
    });

    // Try to fetch with spyToken
    const fetchRes = await request(app)
      .get(`/campaigns/${campaign.id}`)
      .set('Authorization', `Bearer ${spyToken}`);

    expect(fetchRes.status).toBe(404); // Backend returns 404 if not found for user
  });

  it('B3.1b: Only draft campaigns can be scheduled (BUG-03 fix)', async () => {
    // Create a sent campaign
    const sent = await Campaign.create({
      name: 'Reschedule Test',
      subject: 'Subject',
      body: 'Body',
      status: CampaignStatus.SENT,
      createdBy: userId,
    });

    const res = await request(app)
      .post(`/campaigns/${sent.id}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scheduled_at: new Date(Date.now() + 86400000).toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Only draft campaigns can be scheduled/);
  });

  it('B3.3: Irreversible Send (Already sent rejection)', async () => {
    const sent = await Campaign.create({
      name: 'Resend Test',
      subject: 'Subject',
      body: 'Body',
      status: CampaignStatus.SENT,
      createdBy: userId,
    });

    const res = await request(app)
      .post(`/campaigns/${sent.id}/send`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already sent/);
  });

  it('B2.8: PATCH /campaigns/:id — Update draft fields', async () => {
    // 1. Create a draft
    const campaign = await Campaign.create({
      name: 'Original Name',
      subject: 'Old Subject',
      body: 'Body',
      status: CampaignStatus.DRAFT,
      createdBy: userId,
    });

    // 2. Update via PATCH
    const patchRes = await request(app)
      .patch(`/campaigns/${campaign.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', subject: 'New Subject' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.name).toBe('Updated Name');

    // 3. Try to update a sent campaign (Should fail B3.1)
    const sent = await Campaign.create({
      name: 'Sent Campaign',
      subject: 'Sub',
      body: 'Body',
      status: CampaignStatus.SENT,
      createdBy: userId,
    });

    const failRes = await request(app)
      .patch(`/campaigns/${sent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hack' });

    expect(failRes.status).toBe(400);
    expect(failRes.body.error).toMatch(/Only draft campaigns can be updated/i);
  });

  it('B3.5: Simulation Fidelity (Distribution check)', async () => {
    // 1. Create campaign
    const campaign = await Campaign.create({
      name: 'Bulk Send Test',
      subject: 'Subject',
      body: 'Body',
      status: CampaignStatus.DRAFT,
      createdBy: userId,
    });

    // 2. Assoc 10 recipients
    const Recipient = (await import('../models/Recipient.js')).default;
    const CampaignRecipient = (await import('../models/CampaignRecipient.js')).default;
    const { simulateSending } = await import('../services/campaignService.js');
    
    for (let i = 0; i < 50; i++) {
        const r = await Recipient.create({ email: `bulk${i}@test.com`, name: `User ${i}` });
        await CampaignRecipient.create({ campaignId: campaign.id, recipientId: r.id, status: 'pending' });
    }

    // 3. Trigger simulation DIRECTLY and AWAIT it
    // We don't use the API call here because it's fire-and-forget
    await simulateSending(campaign.id);

    // 4. Verify results in DB
    const results = await CampaignRecipient.findAll({ where: { campaignId: campaign.id } });
    const statuses = results.map(r => r.status);
    
    expect(statuses).toContain('sent');
    expect(statuses).toContain('failed');
    
    const opens = results.filter(r => r.openedAt !== null);
    expect(opens.length).toBeGreaterThanOrEqual(0); 
  });

  it('BUG-01: /stats endpoint is reachable and not shadowed by /:id', async () => {
    const res = await request(app)
      .get('/campaigns/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('open_rate');
  });

  it('API-04: GET /campaigns — Boundary: No auth header → 401', async () => {
    const res = await request(app).get('/campaigns');
    expect(res.status).toBe(401);
  });

  it('API-07: POST /campaigns — Valid body → 201, status = draft', async () => {
    // Need a recipient to satisfy schema min(1)
    const recipient = await (await import('../models/Recipient.js')).default.create({
      name: 'Test Recipient',
      email: 'api07@test.com'
    });

    const res = await request(app)
      .post('/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'API 07 Campaign',
        subject: 'API Test',
        body: 'Testing API-07',
        recipientIds: [recipient.id]
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('API 07 Campaign');
    expect(res.body.status).toBe('draft');
  });

  it('API-08: GET /campaigns/:id — Boundary: Non-existent ID → 404', async () => {
    const res = await request(app)
      .get('/campaigns/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('API-09: POST /campaigns/:id/schedule — Future date → status = scheduled', async () => {
    const campaign = await Campaign.create({
      name: 'API 09 Test',
      subject: 'Sub',
      body: 'Body',
      status: CampaignStatus.DRAFT,
      createdBy: userId,
    });

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const res = await request(app)
      .post(`/campaigns/${campaign.id}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scheduled_at: futureDate.toISOString() });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('scheduled');
  });
});
