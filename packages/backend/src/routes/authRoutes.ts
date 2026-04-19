import { Router } from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.get('/me', authenticate, (req, res) => {
  const user = (req as any).user;
  res.json({ id: user.id, email: user.email, name: user.name });
});

export default router;
