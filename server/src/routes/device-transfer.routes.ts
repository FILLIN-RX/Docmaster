import { Router } from 'express';
import {
  initiateTransfer, acceptTransfer, rejectTransfer,
  getTransferByToken, getPendingTransfers, getSentTransfers,
} from '../controllers/device-transfer.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/initiate', authMiddleware, initiateTransfer);
router.post('/accept', authMiddleware, acceptTransfer);
router.post('/reject', rejectTransfer);
router.get('/token/:token', getTransferByToken);
router.get('/pending', authMiddleware, getPendingTransfers);
router.get('/sent', authMiddleware, getSentTransfers);

export default router;
