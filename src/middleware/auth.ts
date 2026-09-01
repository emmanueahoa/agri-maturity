import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request & any, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'login required' });
  next();
}

export function requireRole(role: string) {
  return (req: Request & any, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) return res.status(401).json({ error: 'login required' });
    if (req.session.role !== role) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}
