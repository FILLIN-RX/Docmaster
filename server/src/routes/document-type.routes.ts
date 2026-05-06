import { Router } from 'express';
import { DocumentTypeController } from '../controllers/document-type.controller.ts';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.ts';

const router = Router();
const docTypeController = new DocumentTypeController();

/**
 * @route   GET /api/document-types/active
 * @desc    Get all active document types
 * @access  Public
 */
router.get('/active', (req, res) => docTypeController.getActive(req, res));

/**
 * @route   GET /api/document-types
 * @desc    Get all document types
 * @access  Admin
 */
router.get('/', authMiddleware, adminMiddleware, (req, res) => docTypeController.getAll(req, res));

/**
 * @route   POST /api/document-types
 * @desc    Create a new document type
 * @access  Admin
 */
router.post('/', authMiddleware, adminMiddleware, (req, res) => docTypeController.create(req, res));

/**
 * @route   PUT /api/document-types/:id
 * @desc    Update a document type
 * @access  Admin
 */
router.put('/:id', authMiddleware, adminMiddleware, (req, res) => docTypeController.update(req, res));

/**
 * @route   DELETE /api/document-types/:id
 * @desc    Delete a document type
 * @access  Admin
 */
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => docTypeController.delete(req, res));

/**
 * @route   PATCH /api/document-types/:id/toggle
 * @desc    Toggle active status of a document type
 * @access  Admin
 */
router.patch('/:id/toggle', authMiddleware, adminMiddleware, (req, res) => docTypeController.toggleActive(req, res));

export default router;
