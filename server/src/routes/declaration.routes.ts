import { Router } from 'express';
import { 
  createLostDeclaration,
  createFoundDeclaration,
  getMyDeclarations, 
  searchDeclarations,
  getGlobalStats,
  searchPublicFound,
  getDeclarationById
} from '../controllers/declaration.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { upload } from '../utils/upload.utils.ts';

const router = Router();

/**
 * @route GET /api/declarations/stats
 * @desc Get global lost/found stats
 * @access Public
 */
router.get('/stats', getGlobalStats);

/**
 * @route GET /api/declarations/search-public
 * @desc Public fuzzy search for found documents (masked data)
 * @access Public
 */
router.get('/search-public', searchPublicFound);

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

/**
 * @route GET /api/declarations/:id
 * @desc Get a specific declaration by ID
 * @access Private
 */
router.get('/:id', authMiddleware, getDeclarationById);

export default router;
