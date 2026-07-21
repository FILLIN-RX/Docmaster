import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { respondVaultMatch } from '../controllers/vault-match.controller.ts';

const router = Router();

router.post('/respond', authMiddleware, respondVaultMatch);

export default router;
