import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types.js';

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Nicht autorisiert' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as JwtPayload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Ungültiges Token' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }
    return next();
  };
}
