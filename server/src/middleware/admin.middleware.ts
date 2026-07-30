import { Express } from "express";
import {  Request, Response, NextFunction } from 'express'


export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user || (req as any).user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès interdit. Privilèges administrateur requis.'
    });
  }
  next();
}