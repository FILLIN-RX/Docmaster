import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = Router();
const paymentController = new PaymentController();

/**
 * @route POST /api/payments/pay-recovery
 * @desc Process (fictitious) payment for document recovery
 */
router.post('/pay-recovery', (req, res) => paymentController.payRecovery(req, res));

/**
 * @route GET /api/payments/my-history
 * @desc Get payment history for the current user
 */
router.get('/my-history', authMiddleware, (req, res) => paymentController.getMyTransactions(req, res));

/**
 * @route GET /api/payments/admin/all
 * @desc Admin: Get all transactions across the platform
 */
router.get('/admin/all', authMiddleware, (req, res) => paymentController.getAllTransactionsAdmin(req, res));

export default router;
