export type CampaignStatus = 'draft' | 'sending' | 'scheduled' | 'sent';

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Recipient {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface Campaign {
  id: number;
  name: string;
  subject: string;
  body: string;
  status: CampaignStatus;
  scheduledAt: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  recipients?: Recipient[];
  stats?: CampaignStats;
}

export interface CampaignStats {
  total: number;
  sent: number;
  failed: number;
  opened: number;
  open_rate: number;
  send_rate: number;
}
