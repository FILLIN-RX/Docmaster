import { Request, Response } from 'express';
import { deviceTransferService } from '../services/device-transfer.service.ts';

export const initiateTransfer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Non autorisé' });

    const { deviceId, email } = req.body;
    if (!deviceId) return res.status(400).json({ success: false, message: 'ID appareil requis' });
    if (!email) return res.status(400).json({ success: false, message: 'Email du destinataire requis' });

    const result = await deviceTransferService.initiateTransfer(userId, deviceId, email);
    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const acceptTransfer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Non autorisé' });

    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token requis' });

    const result = await deviceTransferService.acceptTransfer(token, userId);
    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const rejectTransfer = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token requis' });

    const result = await deviceTransferService.rejectTransfer(token);
    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getTransferByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params as { token: string };
    if (!token) return res.status(400).json({ success: false, message: 'Token requis' });

    const result = await deviceTransferService.getTransferByToken(token);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getPendingTransfers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Non autorisé' });

    const userRes = await import('../database/db.ts').then(m => m.query('SELECT email FROM users WHERE id = $1', [userId]));
    const email = userRes.rows[0]?.email;
    if (!email) return res.status(400).json({ success: false, message: 'Email non trouvé' });

    const transfers = await deviceTransferService.getPendingTransfers(email);
    res.status(200).json({ success: true, data: transfers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSentTransfers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Non autorisé' });

    const transfers = await deviceTransferService.getSentTransfers(userId);
    res.status(200).json({ success: true, data: transfers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
