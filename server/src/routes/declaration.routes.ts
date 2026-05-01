import { Router } from 'express';
import { 
  createLostDeclaration,
  createFoundDeclaration,
  getMyDeclarations, 
  searchDeclarations 
} from '../controllers/declaration.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { upload } from '../utils/upload.utils.ts';

const router = Router();

/**
 * @route POST /api/declarations/lost
 * @desc Create a new lost declaration
 * @access Private
 */
router.post('/lost', authMiddleware, upload.fields([
  { name: 'photo_recto', maxCount: 1 },
  { name: 'photo_verso', maxCount: 1 }
]), createLostDeclaration);

/**
 * @route POST /api/declarations/found
 * @desc Create a new found declaration
 * @access Private
 */
router.post('/found', authMiddleware, upload.fields([
  { name: 'photo_recto', maxCount: 1 },
  { name: 'photo_verso', maxCount: 1 }
]), createFoundDeclaration);

/**
 * @route GET /api/declarations/me
 * @desc Get user's own declarations
 * @access Private
 */
router.get('/me', authMiddleware, getMyDeclarations);

/**
 * @route GET /api/declarations
 * @desc Search declarations with filters (ville, doc_type, declaration_type)
 * @access Public
 */
router.get('/', searchDeclarations);

export default router;
