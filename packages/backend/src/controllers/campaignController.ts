import { Request, Response } from 'express';
import Campaign, { CampaignStatus } from '../models/Campaign.js';
import CampaignRecipient, { RecipientStatus } from '../models/CampaignRecipient.js';
import Recipient from '../models/Recipient.js';
import { Op } from 'sequelize';

export const listCampaigns = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where: { createdBy: userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      campaigns,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('List campaigns error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { name, subject, body, recipientIds } = req.body;
    const userId = (req as any).user.id;

    const campaign = await Campaign.create({
      name,
      subject,
      body,
      createdBy: userId,
      status: CampaignStatus.DRAFT,
    });

    if (recipientIds && Array.isArray(recipientIds)) {
      const links = recipientIds.map((id: number) => ({
        campaignId: campaign.id,
        recipientId: id,
        status: RecipientStatus.PENDING,
      }));
      await CampaignRecipient.bulkCreate(links);
    }

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const campaign = await Campaign.findOne({
      where: { id, createdBy: userId },
      include: [{ model: Recipient, as: 'recipients' }],
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Aggregate stats
    const stats = await CampaignRecipient.findAll({
      where: { campaignId: id },
      attributes: ['status', 'openedAt'],
    });

    const total = stats.length;
    const sent = stats.filter((s) => s.status === RecipientStatus.SENT).length;
    const failed = stats.filter((s) => s.status === RecipientStatus.FAILED).length;
    const opened = stats.filter((s) => s.openedAt !== null).length;

    const open_rate = total > 0 ? (opened / total) * 100 : 0;
    const send_rate = total > 0 ? (sent / total) * 100 : 0;

    const data = campaign.toJSON() as any;
    data.recipients = data.recipients.map((r: any) => ({
      ...r,
      status: r.CampaignRecipient?.status,
      sentAt: r.CampaignRecipient?.sentAt,
      openedAt: r.CampaignRecipient?.openedAt,
    }));

    res.json({
      ...data,
      stats: { total, sent, failed, opened, open_rate, send_rate },
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { name, subject, body } = req.body;

    const campaign = await Campaign.findOne({ where: { id, createdBy: userId } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      return res.status(400).json({ error: 'Only draft campaigns can be updated' });
    }

    await campaign.update({ name, subject, body });
    res.json(campaign);
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const campaign = await Campaign.findOne({ where: { id, createdBy: userId } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      return res.status(400).json({ error: 'Only draft campaigns can be deleted' });
    }

    await campaign.destroy();
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const scheduleCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduled_at } = req.body;
    const userId = (req as any).user.id;

    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'scheduled_at must be a future timestamp' });
    }

    const campaign = await Campaign.findOne({ where: { id, createdBy: userId } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      return res.status(400).json({ error: 'Only draft campaigns can be scheduled' });
    }

    await campaign.update({
      status: CampaignStatus.SCHEDULED,
      scheduledAt: scheduledDate,
    });

    res.json(campaign);
  } catch (error) {
    console.error('Schedule campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const sendCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const campaign = await Campaign.findOne({ where: { id, createdBy: userId } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === CampaignStatus.SENT) {
      return res.status(400).json({ error: 'Campaign already sent' });
    }

    // Trigger simulation without awaiting it (asynchronous)
    import('../services/campaignService.js').then((service) => {
      service.simulateSending(Number(id));
    });

    res.json({ message: 'Campaign sending initiated' });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
export const getOverallStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Find all campaigns for this user
    const campaigns = await Campaign.findAll({
      where: { createdBy: userId },
      attributes: ['id'],
    });
    
    const campaignIds = campaigns.map(c => c.id);
    
    if (campaignIds.length === 0) {
      return res.json({ total: 0, sent: 0, failed: 0, opened: 0, open_rate: 0, send_rate: 0 });
    }

    const stats = await CampaignRecipient.findAll({
      where: { campaignId: { [Op.in]: campaignIds } },
      attributes: ['status', 'openedAt'],
    });

    const total = stats.length;
    const sent = stats.filter((s) => s.status === RecipientStatus.SENT).length;
    const failed = stats.filter((s) => s.status === RecipientStatus.FAILED).length;
    const opened = stats.filter((s) => s.openedAt !== null).length;

    const open_rate = total > 0 ? (opened / total) * 100 : 0;
    const send_rate = total > 0 ? (sent / total) * 100 : 0;

    res.json({ total, sent, failed, opened, open_rate, send_rate });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
