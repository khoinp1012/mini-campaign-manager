import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

export enum CampaignStatus {
  DRAFT = 'draft',
  SENDING = 'sending',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
}

class Campaign extends Model {
  declare id: number;
  declare name: string;
  declare subject: string;
  declare body: string;
  declare status: CampaignStatus;
  declare scheduledAt: Date | null;
  declare createdBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Campaign.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CampaignStatus)),
      defaultValue: CampaignStatus.DRAFT,
      allowNull: false,
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Campaign',
  }
);

Campaign.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Campaign, { foreignKey: 'createdBy', as: 'campaigns' });

export default Campaign;
