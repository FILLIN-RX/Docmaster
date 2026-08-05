import jwt from 'jsonwebtoken';

const AUTORITE_JWT_SECRET = process.env.AUTORITE_JWT_SECRET || 'autorite-secret-change-in-production';
const AUTORITE_JWT_EXPIRY = process.env.AUTORITE_JWT_EXPIRY || '24h';

export const autoriteJwtConfig = {
  secret: AUTORITE_JWT_SECRET,
  expiry: AUTORITE_JWT_EXPIRY,
};

/**
 * Generate JWT token for authority (separate secret from user tokens)
 */
export const generateAutoriteToken = (autoriteId: string, email: string, niveau: string): string => {
  return jwt.sign(
    { id: autoriteId, email, niveau, type: 'AUTORITE' },
    autoriteJwtConfig.secret,
    { expiresIn: AUTORITE_JWT_EXPIRY as jwt.SignOptions['expiresIn'] }
  );
};

/**
 * Verify JWT token for authority
 */
export const verifyAutoriteToken = (token: string): any => {
  try {
    const decoded: any = jwt.verify(token, autoriteJwtConfig.secret);
    if (decoded.type !== 'AUTORITE') {
      throw new Error('Token incompatible avec le module autorités');
    }
    return decoded;
  } catch (error) {
    throw new Error('Token invalide ou expiré');
  }
};