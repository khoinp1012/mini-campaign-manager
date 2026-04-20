import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Primary config from system environment
const dbUrl = process.env.DATABASE_URL;

// Secondary fallback to .env for local development
if (!dbUrl) {
  dotenv.config({ path: path.join(__dirname, '../../../../.env') });
}

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/campaign_manager', {
  dialect: 'postgres',
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

export default sequelize;
