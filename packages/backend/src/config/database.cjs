const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

const dbUrl = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/campaign_manager';

module.exports = {
  development: {
    url: dbUrl,
    dialect: 'postgres',
    define: {
      underscored: true,
      timestamps: true,
    },
    logging: false
  },
  test: {
    url: dbUrl,
    dialect: 'postgres',
    define: {
      underscored: true,
      timestamps: true,
    },
    logging: false
  },
  production: {
    url: dbUrl,
    dialect: 'postgres',
    define: {
      underscored: true,
      timestamps: true,
    },
    logging: false
  }
};
