import { Request, Response } from 'express';
import Recipient from '../models/Recipient.js';

export const listRecipients = async (req: Request, res: Response) => {
  try {
    const recipients = await Recipient.findAll();
    res.json(recipients);
  } catch (error) {
    console.error('List recipients error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createRecipient = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    const recipient = await Recipient.create({ email, name });
    res.status(201).json(recipient);
  } catch (error) {
    console.error('Create recipient error:', error);
    if ((error as any).name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Recipient with this email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};
