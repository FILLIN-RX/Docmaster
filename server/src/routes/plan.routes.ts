import { Router } from 'express';
import { 
  getAllPlans,
  getPlanById, 
  updatePlan, 
  createPlan,
  getFeatureDefinitions
} from '../controllers/plan.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = Router();

// Middleware de vérification admin
const adminMiddleware = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ success: false, message: "Accès refusé. Droits administrateur requis." });
    }
};

// Public-ish routes for plans (must be authenticated)
router.get('/', authMiddleware, getAllPlans);
router.get('/:id', authMiddleware, adminMiddleware, getPlanById);
router.get('/features/definitions', authMiddleware, adminMiddleware, getFeatureDefinitions);
router.put('/:id', authMiddleware, adminMiddleware, updatePlan);
router.post('/', authMiddleware, adminMiddleware, createPlan);

export default router;
