import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Recipient extends Model {
  declare id: number;
  declare email: string;
  declare name: string;
  declare readonly createdAt: Date;
}

Recipient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Recipient',
    updatedAt: false, // Recipients only tracking creation
  }
);

export default Recipient;
