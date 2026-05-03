import { Router } from 'express';
import { 
  getAllSubscriptions, 
  getAdminStats, 
  updateSubscriptionStatus 
} from '../controllers/subscription.controller.ts';
import { subscriptionRepository } from '../repositories/subscription.repository.ts';
import { DeclarationRepository } from '../repositories/declaration.repository.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = Router();

// Middleware de vérification admin à ajouter ici si nécessaire
const adminMiddleware = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ success: false, message: "Accès refusé. Droits administrateur requis." });
    }
};

router.get('/admin/stats', authMiddleware, adminMiddleware, getAdminStats);
router.get('/admin/all', authMiddleware, adminMiddleware, getAllSubscriptions);
router.patch('/admin/:id/status', authMiddleware, adminMiddleware, updateSubscriptionStatus);

const declarationRepository = new DeclarationRepository();

// User routes
/**
 * @route GET /api/subscriptions/my-subscription
 * @desc Get current user's active subscription and usage
 */
router.get('/my-subscription', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const sub = await subscriptionRepository.findActiveByUserId(userId);
        
        if (!sub) {
            return res.json({ success: true, data: null });
        }

        const docCount = await declarationRepository.countByReporterId(userId);
        
        res.json({ 
            success: true, 
            data: {
                ...sub,
                doc_count: docCount,
                doc_limit: sub.features?.docs_per_type || 1
            } 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.post('/subscribe', authMiddleware, async (req: any, res: any) => {
    try {
        const { planId, months } = req.body;
        const userId = req.user.id;
        
        // Calculate end date
        const dateDebut = new Date();
        const dateFin = new Date();
        dateFin.setMonth(dateFin.getMonth() + (months || 1));

        const sub = await subscriptionRepository.create({
            user_id: userId,
            plan_id: planId,
            date_debut: dateDebut,
            date_fin: dateFin,
            status: 'ACTIVE'
        });

        res.status(201).json({ success: true, data: sub });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
