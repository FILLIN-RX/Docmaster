import { Router } from 'express';
import { 
  createShare, 
  getSharedDocument, 
  getDocumentShares, 
  revokeShare 
} from '../controllers/share.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = Router();

/**
 * Public: Get shared document by token
 */
router.get('/public/:token', getSharedDocument);

/**
 * Protected: Create a share link
 */
router.post('/:documentId', authMiddleware, createShare);

/**
 * Protected: List shares for a document
 */
router.get('/:documentId', authMiddleware, getDocumentShares);

/**
 * Protected: Revoke a share link
 */
router.delete('/:shareId', authMiddleware, revokeShare);

export default router;
