import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const migrator = new Umzug({
  migrations: {
    glob: path.join(__dirname, '../migrations/*.cjs'),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export type Migration = typeof migrator._types.migration;
