import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import sequelize from './config/database.js';
import { migrator } from './config/migrator.js';
import authRoutes from './routes/authRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import recipientRoutes from './routes/recipientRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({
  origin: true, // Allow all origins in development to avoid 127.0.0.1 vs localhost issues
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/recipients', recipientRoutes);

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // In production, use migrations.
    console.log('Running migrations...');
    await migrator.up();
    console.log('Database migrations completed.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Only start server if not testing, or if explicitly requested for E2E
if (process.env.NODE_ENV !== 'test' || process.env.E2E_SERVER === 'true') {
  startServer();
}
