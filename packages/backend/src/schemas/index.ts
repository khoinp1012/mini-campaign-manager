import { z } from 'zod';

export const CampaignSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(255),
  body: z.string().min(10, 'Body must be at least 10 characters'),
  recipientIds: z.array(z.number()).min(1, 'At least one recipient is required'),
});

export const UpdateCampaignSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  subject: z.string().min(3).max(255).optional(),
  body: z.string().min(10).optional(),
});

export const ScheduleCampaignSchema = z.object({
  scheduled_at: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, {
    message: 'scheduled_at must be a valid future date',
  }),
});

export const RecipientSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email('Invalid email address'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});
