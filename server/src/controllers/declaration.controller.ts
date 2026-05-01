import { Request, Response } from 'express';
import { DeclarationService } from '../services/declaration.service.ts';

const declarationService = new DeclarationService();

export const createLostDeclaration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const data = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const photo_recto = files?.photo_recto?.[0]?.path;
    const photo_verso = files?.photo_verso?.[0]?.path;

    const result = await declarationService.createDeclaration({
      ...data,
      declaration_type: 'LOST',
      reporter_id: userId,
      photo_recto,
      photo_verso
    });

    res.status(201).json({
      success: true,
      message: 'Déclaration de perte enregistrée',
      data: result
    });
  } catch (error: any) {
    console.error('❌ Erreur création déclaration perte:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFoundDeclaration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const data = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const photo_recto = files?.photo_recto?.[0]?.path;
    const photo_verso = files?.photo_verso?.[0]?.path;

    const result = await declarationService.createDeclaration({
      ...data,
      declaration_type: 'FOUND',
      reporter_id: userId,
      photo_recto,
      photo_verso
    });

    res.status(201).json({
      success: true,
      message: 'Déclaration de document trouvé enregistrée',
      data: result
    });
  } catch (error: any) {
    console.error('❌ Erreur création déclaration trouvaille:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyDeclarations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const result = await declarationService.getUserDeclarations(userId);
    res.json({ success: true, count: result.length, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchDeclarations = async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    const result = await declarationService.searchDeclarations(filters);
    res.json({ success: true, count: result.length, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
