import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import Campaign from './Campaign.js';
import Recipient from './Recipient.js';

export enum RecipientStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

class CampaignRecipient extends Model {
  declare campaignId: number;
  declare recipientId: number;
  declare sentAt: Date | null;
  declare openedAt: Date | null;
  declare status: RecipientStatus;
}

CampaignRecipient.init(
  {
    campaignId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Campaign,
        key: 'id',
      },
    },
    recipientId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Recipient,
        key: 'id',
      },
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    openedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RecipientStatus)),
      defaultValue: RecipientStatus.PENDING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'CampaignRecipient',
    timestamps: false, // Status updates happen manually
  }
);

Campaign.belongsToMany(Recipient, {
  through: CampaignRecipient,
  foreignKey: 'campaignId',
  otherKey: 'recipientId',
  as: 'recipients',
});

Recipient.belongsToMany(Campaign, {
  through: CampaignRecipient,
  foreignKey: 'recipientId',
  otherKey: 'campaignId',
  as: 'campaigns',
});

export default CampaignRecipient;
