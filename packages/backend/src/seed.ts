import bcrypt from 'bcryptjs';
import sequelize from './config/database.js';
import User from './models/User.js';
import Recipient from './models/Recipient.js';
import Campaign, { CampaignStatus } from './models/Campaign.js';
import CampaignRecipient, { RecipientStatus } from './models/CampaignRecipient.js';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync database (force: false to avoid accidental data loss if run multiple times, 
    // but we can usesync({ force: true }) if we want a clean slate).
    // Given it's a demo seed, let's go with a clean slate.
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized.');

    // 1. Create Demo User
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      name: 'Demo Admin',
      email: 'demo@example.com',
      password: hashedPassword,
    });
    console.log(`✅ User created: ${user.email}`);

    // 2. Create Recipients
    const recipientsData = [
      { name: 'Alice Johnson', email: 'alice@example.com' },
      { name: 'Bob Smith', email: 'bob@example.com' },
      { name: 'Charlie Brown', email: 'charlie@example.com' },
      { name: 'Diana Prince', email: 'diana@example.com' },
      { name: 'Edward Norton', email: 'edward@example.com' },
      { name: 'Fiona Gallagher', email: 'fiona@example.com' },
      { name: 'George Miller', email: 'george@example.com' },
      { name: 'Hannah Arendt', email: 'hannah@example.com' },
      { name: 'Ian McKellen', email: 'ian@example.com' },
      { name: 'Jane Doe', email: 'jane@example.com' },
      { name: 'Kevin Hart', email: 'kevin@example.com' },
      { name: 'Lara Croft', email: 'lara@example.com' },
      { name: 'Michael Scott', email: 'michael@example.com' },
      { name: 'Nina Simone', email: 'nina@example.com' },
      { name: 'Oscar Wilde', email: 'oscar@example.com' },
      { name: 'Peter Parker', email: 'peter@example.com' },
      { name: 'Quentin Tarantino', email: 'quentin@example.com' },
      { name: 'Rachel Green', email: 'rachel@example.com' },
      { name: 'Steve Rogers', email: 'steve@example.com' },
      { name: 'Tony Stark', email: 'tony@example.com' },
    ];

    const recipients = await Recipient.bulkCreate(recipientsData);
    console.log(`✅ ${recipients.length} recipients created.`);

    // 3. Create Campaigns
    
    // 3.1 Sent Campaign (Rich Data)
    const sentCampaign = await Campaign.create({
      name: 'Spring Newsletter 2026',
      subject: 'Welcome to our Spring Collection!',
      body: '<h1>Spring is here!</h1><p>Check out our latest arrivals and discounts.</p>',
      status: CampaignStatus.SENT,
      createdBy: user.id,
    });

    // Add recipients to sent campaign with mixed statuses
    const sentCampaignRecipients = recipients.map((r, index) => {
      let status = RecipientStatus.SENT;
      let openedAt = null;
      let sentAt = new Date(Date.now() - 3600000 * 24); // 24 hours ago

      if (index % 5 === 0) {
        status = RecipientStatus.FAILED;
      } else if (index % 3 === 0) {
        openedAt = new Date(Date.now() - 3600000 * 20); // 20 hours ago
      }

      return {
        campaignId: sentCampaign.id,
        recipientId: r.id,
        status,
        sentAt,
        openedAt,
      };
    });
    await CampaignRecipient.bulkCreate(sentCampaignRecipients);
    console.log('✅ Sent campaign seeded with analytics data.');

    // 3.2 Scheduled Campaign
    const campaignNames = [
      'Summer Blast ⛱️', 'Flash Sale 🔥', 'Product Launch 🚀', 
      'Newsletter #1', 'Weekly Update', 'Customer Loyalty',
      'Early Bird Access', 'Feature Announcement', 'Bug Fix Update',
      'Webinar Invitation', 'Exclusive Discount', 'Partnership Update',
      'System Maintenance', 'Community Spotlight', 'Year-End Promo'
    ];

    for (let i = 0; i < campaignNames.length; i++) {
      const status = i < 3 ? CampaignStatus.SENT : i < 6 ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT;
      const campaign = await Campaign.create({
        name: campaignNames[i],
        subject: `Exciting News: ${campaignNames[i]}`,
        body: `<h1>Hello!</h1><p>Check out our latest update: ${campaignNames[i]}</p>`,
        status,
        scheduledAt: status === CampaignStatus.SCHEDULED ? new Date(Date.now() + 86400000 * (i + 1)) : null,
        createdBy: user.id
      });

      // Assign recipients
      const shuffled = [...recipients].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      
      const links = selected.map(r => ({
        campaignId: campaign.id,
        recipientId: r.id,
        status: status === CampaignStatus.SENT ? RecipientStatus.SENT : RecipientStatus.PENDING,
        sentAt: status === CampaignStatus.SENT ? new Date() : null,
        openedAt: (status === CampaignStatus.SENT && Math.random() > 0.5) ? new Date() : null
      }));
      
      await CampaignRecipient.bulkCreate(links);
    }

    console.log('🚀 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
