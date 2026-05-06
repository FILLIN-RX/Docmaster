import { Router } from 'express';
import { ClaimController } from '../controllers/claim.controller.ts';

const router = Router();
const claimController = new ClaimController();

/**
 * @route POST /api/claims/create
 * @desc Create a new claim manually
 * @access Private
 */
router.post('/create', (req, res) => claimController.createClaim(req, res));

/**
 * @route POST /api/claims/validate
 * @desc Validate recovery code for a document
 * @access Private (usually)
 */
router.post('/validate', (req, res) => claimController.validateCode(req, res));

/**
 * @route GET /api/claims/active/:docId
 * @desc Get active claim details for a document
 */
router.get('/active/:docId', (req, res) => claimController.getActiveClaim(req, res));

export default router;
