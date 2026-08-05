import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../config/jwt.ts';
import { PartenaireRepository } from './partenaires.repository.ts';

const repository = new PartenaireRepository();

/**
 * Authenticate a partner via the partner JWT (id = partenaire.id).
 * The token must belong to an ACTIF partenaire profile.
 * Expects: Authorization: Bearer <token> OR cookie "docmaster_token"
 */
export const partenaireAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = (req.cookies as any)?.docmaster_token;
    const authHeader = req.headers.authorization;

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token manquant.'
      });
    }

    const decoded = verifyToken(token);
    const profile = await repository.findById(decoded.id);

    if (!profile) {
      return res.status(401).json({
        success: false,
        message: 'Compte partenaire introuvable.'
      });
    }
    if (profile.statut !== 'ACTIF') {
      return res.status(403).json({
        success: false,
        message: 'Compte partenaire désactivé. Contactez un administrateur.'
      });
    }

    (req as any).partenaire = profile;
    (req as any).user = {
      id: profile.id,
      email: profile.email,
      role: 'PARTNER',
    };
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token invalide ou expiré.'
    });
  }
};
