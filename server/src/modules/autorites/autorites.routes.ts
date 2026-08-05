import { Router } from 'express';
import { AutoriteController } from './autorites.controller.ts';
import { autoriteAuthMiddleware, hauteMiddleware } from './autorites.middleware.ts';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.middleware.ts';

const router = Router();
const controller = new AutoriteController();

/**
 * ── PUBLIC ──
 */
// POST /api/autorites/login — authority login
router.post('/login', controller.login);
// POST /api/autorites/logout — authority logout
router.post('/logout', controller.logout);

/**
 * ── AUTORITE (JWT dédié) ──
 */
// POST /api/autorites/change-password — first login mandatory password change
router.post('/change-password', autoriteAuthMiddleware, controller.changePassword);
// GET /api/autorites/me — current authority profile
router.get('/me', autoriteAuthMiddleware, controller.me);
// GET /api/autorites/stats — authority dashboard stats
router.get('/stats', autoriteAuthMiddleware, controller.getStats);
// GET /api/autorites/activity — zone activity journal (HAUTE: region, NORMAL: city)
router.get('/activity', autoriteAuthMiddleware, controller.getActivityLogs);
// GET /api/autorites/declarations — declarations visible to the authority
router.get('/declarations', autoriteAuthMiddleware, controller.getDeclarations);
// GET /api/autorites/declarations/:id/pdf — declaration PDF (with certification stamp)
router.get('/declarations/:id/pdf', autoriteAuthMiddleware, controller.generatePdf);
// POST /api/autorites/declarations/:id/certify — certify a declaration
router.post('/declarations/:id/certify', autoriteAuthMiddleware, controller.certify);
// POST /api/autorites/declarations/:id/uncertify — HAUTE only
router.post('/declarations/:id/uncertify', autoriteAuthMiddleware, hauteMiddleware, controller.uncertify);
// POST /api/autorites/create — HAUTE creates a NORMAL authority
router.post('/create', autoriteAuthMiddleware, hauteMiddleware, controller.createByHaute);
// GET /api/autorites/managed — HAUTE lists authorities it created
router.get('/managed', autoriteAuthMiddleware, hauteMiddleware, controller.getManaged);
// DELETE /api/autorites/managed/:id — HAUTE deletes an authority it created
router.delete('/managed/:id', autoriteAuthMiddleware, hauteMiddleware, controller.deleteManaged);

/**
 * ── ADMIN (token utilisateur admin) ──
 */
// POST /api/autorites — admin creates an authority
router.post('/', authMiddleware, adminMiddleware, controller.create);
// GET /api/autorites — admin lists authorities
router.get('/', authMiddleware, adminMiddleware, controller.findAll);
// GET /api/autorites/:id — admin gets authority detail
router.get('/:id', authMiddleware, adminMiddleware, controller.findById);
// PUT /api/autorites/:id — admin updates an authority
router.put('/:id', authMiddleware, adminMiddleware, controller.update);
// DELETE /api/autorites/:id — admin deletes an authority
router.delete('/:id', authMiddleware, adminMiddleware, controller.delete);

export default router;
