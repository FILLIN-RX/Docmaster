import { Router } from 'express';
import {
  requestDeletionDeclaration,
  getMyDeletionRequests,
  getDeletionRequestById,
  getPendingDeletionRequests,
  approveDeletionRequest,
  rejectDeletionRequest
} from '../controllers/deletion-request.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = Router();

/**
 * @route GET /api/deletion-requests/me
 * @desc Get user's deletion requests
 * @access Private
 */
router.get('/me', authMiddleware, getMyDeletionRequests);

/**
 * @route GET /api/deletion-requests/:id
 * @desc Get a specific deletion request
 * @access Private
 */
router.get('/:id', authMiddleware, getDeletionRequestById);

/**
 * @route POST /api/declarations/:id/request-deletion
 * @desc Request declaration deletion with reason
 * @access Private
 */
router.post('/declarations/:id/request-deletion', authMiddleware, requestDeletionDeclaration);

/**
 * @route GET /api/admin/deletion-requests
 * @desc Get all pending deletion requests (admin only)
 * @access Admin
 */
router.get('/admin/pending', authMiddleware, getPendingDeletionRequests);

/**
 * @route POST /api/admin/deletion-requests/:id/approve
 * @desc Approve a deletion request (admin only)
 * @access Admin
 */
router.post('/admin/:id/approve', authMiddleware, approveDeletionRequest);

/**
 * @route POST /api/admin/deletion-requests/:id/reject
 * @desc Reject a deletion request (admin only)
 * @access Admin
 */
router.post('/admin/:id/reject', authMiddleware, rejectDeletionRequest);

export default router;
