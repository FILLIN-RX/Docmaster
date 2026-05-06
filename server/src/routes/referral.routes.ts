import { Router } from 'express';
import { ReferralController } from '../controllers/referral.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = Router();
const referralController = new ReferralController();

/**
 * GET /referrals
 * Get all referrals and stats for the authenticated user
 */
router.get('/', authMiddleware, (req, res) => referralController.getMyReferrals(req, res));

/**
 * GET /referrals/admin
 * Admin: Get all referrals across the platform
 */
router.get('/admin', authMiddleware, (req, res) => referralController.getAllReferrals(req, res));

/**
 * PATCH /referrals/admin/:id/reward
 * Admin: Reward a referral manually
 */
router.patch('/admin/:id/reward', authMiddleware, (req, res) => referralController.rewardReferral(req, res));

export default router;
