import { Router } from 'express';
import { listRecipients, createRecipient } from '../controllers/recipientController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { RecipientSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', listRecipients);
router.post('/', validate(RecipientSchema), createRecipient);

export default router;
