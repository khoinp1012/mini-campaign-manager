'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ context: queryInterface }) {
    // Indexes for Campaigns
    await queryInterface.addIndex('campaigns', ['status'], { name: 'campaigns_status_idx' });
    await queryInterface.addIndex('campaigns', ['created_by'], { name: 'campaigns_created_by_idx' });

    // Indexes for CampaignRecipients
    // Note: campaign_id is already indexed as part of the PK (campaign_id, recipient_id)
    // but recipient_id as the second column in the PK index won't help with standalone recipient queries.
    await queryInterface.addIndex('campaign_recipients', ['recipient_id'], { name: 'campaign_recipients_recipient_id_idx' });
    await queryInterface.addIndex('campaign_recipients', ['status'], { name: 'campaign_recipients_status_idx' });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeIndex('campaign_recipients', 'campaign_recipients_status_idx');
    await queryInterface.removeIndex('campaign_recipients', 'campaign_recipients_recipient_id_idx');
    await queryInterface.removeIndex('campaigns', 'campaigns_created_by_idx');
    await queryInterface.removeIndex('campaigns', 'campaigns_status_idx');
  }
};
