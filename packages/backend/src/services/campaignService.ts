import Campaign, { CampaignStatus } from '../models/Campaign.js';
import CampaignRecipient, { RecipientStatus } from '../models/CampaignRecipient.js';

export const simulateSending = async (campaignId: number) => {
  try {
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) return;

    // Transition to SENDING
    await campaign.update({ status: CampaignStatus.SENDING });

    const recipients = await CampaignRecipient.findAll({
      where: { campaignId },
    });

    if (process.env.NODE_ENV !== 'test') {
      console.log(`Starting simulation for campaign ${campaignId} with ${recipients.length} recipients`);
    }

    // Simulate async processing for each recipient
    for (const record of recipients) {
      // Small random delay to simulate network latency, disabled in tests
      if (process.env.NODE_ENV !== 'test') {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));
      }

      const isSuccess = Math.random() > 0.1; // 90% success rate
      const isOpened = isSuccess && Math.random() > 0.4; // ~60% of sent emails are opened

      await record.update({
        status: isSuccess ? RecipientStatus.SENT : RecipientStatus.FAILED,
        sentAt: isSuccess ? new Date() : null,
        openedAt: isOpened ? new Date(Date.now() + Math.random() * 2000000) : null,
      });

      if (process.env.NODE_ENV !== 'test') {
        console.log(`Recipient ${record.recipientId} for campaign ${campaignId}: ${isSuccess ? 'SENT' : 'FAILED'}`);
      }
    }

    // Mark campaign as SENT
    await campaign.update({ status: CampaignStatus.SENT });
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Campaign ${campaignId} simulation completed.`);
    }
  } catch (error) {
    console.error(`Simulation error for campaign ${campaignId}:`, error);
  }
};
