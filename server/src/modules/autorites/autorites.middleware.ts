import { Request, Response, NextFunction } from 'express';
import { verifyAutoriteToken } from './autorites.config.ts';
import { AutoriteRepository } from './autorites.repository.ts';

const repository = new AutoriteRepository();

/**
 * Authenticate an authority via its dedicated JWT
 * Expects: Authorization: Bearer <token> OR cookie "autorite_token"
 */
export const autoriteAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = (req.cookies as any)?.autorite_token;
    const authHeader = req.headers.authorization;

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token autorité manquant.'
      });
    }

    const decoded = verifyAutoriteToken(token);
    const autorite = await repository.findById(decoded.id);
    if (!autorite) {
      return res.status(401).json({
        success: false,
        message: 'Autorité introuvable.'
      });
    }
    if (!autorite.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé. Contactez un administrateur.'
      });
    }
    (req as any).autorite = {
      id: autorite.id,
      email: autorite.email,
      nom: autorite.nom,
      prenom: autorite.prenom,
      niveau: autorite.niveau,
      ville: autorite.ville,
      region: autorite.region,
      type: 'AUTORITE',
    };
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token invalide ou expiré.'
    });
  }
};

/**
 * Only HAUTE level authorities
 */
export const hauteMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const autorite = (req as any).autorite;
  if (!autorite || autorite.niveau !== 'HAUTE') {
    return res.status(403).json({
      success: false,
      message: 'Accès interdit. Privilèges d\'autorité haute requis.'
    });
  }
  next();
};
