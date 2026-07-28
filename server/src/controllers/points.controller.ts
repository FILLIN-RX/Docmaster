import { Request, Response } from 'express';
import { pointsService } from '../services/points.service.ts';

export const getPointsRate = async (req: Request, res: Response) => {
  try {
    const rate = await pointsService.getExchangeRate();
    res.status(200).json({ success: true, rate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const convertPoints = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Non autorisé' });

    const { amount, password } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Montant invalide' });

    const result = await pointsService.convertPointsToWallet(userId, amount, password);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('❌ convertPoints error:', error);
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const purchasePoints = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Non autorisé' });

    const { pointsAmount, phone, method } = req.body;
    if (!pointsAmount || pointsAmount <= 0) return res.status(400).json({ success: false, message: 'Nombre de points invalide' });
    if (!phone) return res.status(400).json({ success: false, message: 'Numéro de téléphone requis' });
    if (!['MTN_MOMO', 'ORANGE_MONEY'].includes(method)) return res.status(400).json({ success: false, message: 'Méthode de paiement invalide' });

    const result = await pointsService.purchasePoints(userId, pointsAmount, phone, method);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('❌ purchasePoints error:', error);
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
