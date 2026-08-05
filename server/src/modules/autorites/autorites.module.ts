/**
 * Module Autorités — module autonome partageant la même base de données.
 * Point d'entrée : exporte les routes à monter dans index.ts
 */
import autoriteRoutes from './autorites.routes.ts';

export { autoriteRoutes };
export { AutoriteService } from './autorites.service.ts';
export { AutoriteRepository } from './autorites.repository.ts';
export { generateAutoriteToken, verifyAutoriteToken } from './autorites.config.ts';
export { autoriteAuthMiddleware, hauteMiddleware } from './autorites.middleware.ts';
