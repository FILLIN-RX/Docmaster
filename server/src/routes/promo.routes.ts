import { Router } from 'express';
import { PromoController } from '../controllers/promo.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = Router();
const promoController = new PromoController();

const adminMiddleware = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ success: false, message: "Accès refusé. Droits administrateur requis." });
    }
};

router.get('/active', authMiddleware, (req, res) => promoController.getActivePromo(req, res));
router.post('/subscribe', authMiddleware, (req, res) => promoController.subscribeToPromo(req, res));

router.get('/admin', authMiddleware, adminMiddleware, (req, res) => promoController.getAdminPromo(req, res));
router.put('/admin', authMiddleware, adminMiddleware, (req, res) => promoController.updateAdminPromo(req, res));

export default router;
