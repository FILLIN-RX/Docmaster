import { Request, Response } from 'express';
import { query } from '../database/db.ts';
import { subscriptionService } from '../services/subscription.service.ts';
import { planRepository } from '../repositories/plan.repository.ts';
import { notificationService } from '../services/notification.service.js';

const PROMO_PLAN_ID = 'vip_promo_2m';

export class PromoController {

  async getPublicPromo(req: Request, res: Response) {
    try {
      const plan = await planRepository.findById(PROMO_PLAN_ID);
      if (!plan || !plan.is_active) {
        return res.json({ success: true, data: null });
      }

      const vipPlan = await planRepository.findById('vip');
      const originalPrice = vipPlan ? vipPlan.price * (plan.duration_months || 1) : null;

      res.json({
        success: true,
        data: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          original_price: originalPrice,
          duration_months: plan.duration_months,
          features: plan.features,
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getActivePromo(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const plan = await planRepository.findById(PROMO_PLAN_ID);
      if (!plan || !plan.is_active) {
        return res.json({ success: true, data: null });
      }

      const activeSub = await query(
        "SELECT id FROM user_subscriptions WHERE user_id = $1 AND status = 'ACTIVE' AND date_fin > NOW() LIMIT 1",
        [userId]
      );
      if (activeSub.rows.length > 0) {
        return res.json({ success: true, data: null });
      }

      const usedPromo = await query(
        "SELECT id FROM user_subscriptions WHERE user_id = $1 AND plan_id = $2 LIMIT 1",
        [userId, PROMO_PLAN_ID]
      );
      if (usedPromo.rows.length > 0) {
        return res.json({ success: true, data: null });
      }

      const vipPlan = await planRepository.findById('vip');
      const originalPrice = vipPlan ? vipPlan.price * (plan.duration_months || 1) : null;

      res.json({
        success: true,
        data: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          original_price: originalPrice,
          duration_months: plan.duration_months,
          features: plan.features,
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async subscribeToPromo(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { paymentMethod, phone } = req.body;

      const plan = await planRepository.findById(PROMO_PLAN_ID);
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Promo introuvable.' });
      }

      const activeSub = await query(
        "SELECT id FROM user_subscriptions WHERE user_id = $1 AND status = 'ACTIVE' AND date_fin > NOW() LIMIT 1",
        [userId]
      );
      if (activeSub.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Vous avez déjà un abonnement actif.' });
      }

      const usedPromo = await query(
        "SELECT id FROM user_subscriptions WHERE user_id = $1 AND plan_id = $2 LIMIT 1",
        [userId, PROMO_PLAN_ID]
      );
      if (usedPromo.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Vous avez déjà utilisé cette offre.' });
      }

      const result = await subscriptionService.subscribeUser(userId, PROMO_PLAN_ID, 1, {
        method: paymentMethod || 'POINTS',
        phone: phone || '',
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAdminPromo(req: Request, res: Response) {
    try {
      const plan = await planRepository.findById(PROMO_PLAN_ID);
      if (!plan) {
        return res.json({ success: true, data: null });
      }

      const vipPlan = await planRepository.findById('vip');
      const originalPrice = vipPlan ? vipPlan.price * (plan.duration_months || 1) : null;

      res.json({
        success: true,
        data: {
          id: plan.id,
          name: plan.name,
          price: Number(plan.price),
          original_price: originalPrice,
          duration_months: plan.duration_months,
          features: plan.features,
          is_active: plan.is_active,
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateAdminPromo(req: Request, res: Response) {
    try {
      const { price, duration_months, is_active, features } = req.body;

      const plan = await planRepository.findById(PROMO_PLAN_ID);
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Promo introuvable.' });
      }

      const updateData: Record<string, any> = {};
      if (price !== undefined) updateData.price = price;
      if (duration_months !== undefined) updateData.duration_months = duration_months;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (features !== undefined) updateData.features = features;

      const updated = await planRepository.update(PROMO_PLAN_ID, updateData);

      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
