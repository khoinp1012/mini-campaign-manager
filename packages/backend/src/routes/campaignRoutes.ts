import { Router } from 'express';
import {
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  scheduleCampaign,
  sendCampaign,
  getOverallStats,
} from '../controllers/campaignController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { 
  CampaignSchema, 
  UpdateCampaignSchema, 
  ScheduleCampaignSchema 
} from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', listCampaigns);
router.post('/', validate(CampaignSchema), createCampaign);
router.get('/stats', getOverallStats);
router.get('/:id', getCampaign);
router.patch('/:id', validate(UpdateCampaignSchema), updateCampaign);
router.delete('/:id', deleteCampaign);
router.post('/:id/schedule', validate(ScheduleCampaignSchema), scheduleCampaign);
router.post('/:id/send', sendCampaign);

export default router;
