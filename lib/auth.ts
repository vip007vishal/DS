import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'worker' | 'admin';
    fullName: string;
  };
  vaultUnlocked?: boolean;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function authenticateVaultToken(req: AuthRequest, res: Response, next: NextFunction) {
  const vaultToken = req.headers['x-vault-token'] as string;
  
  if (!vaultToken) return res.status(403).json({ error: 'Vault access required' });

  jwt.verify(vaultToken, JWT_SECRET, (err: any, decoded: any) => {
    if (err || !decoded.vaultUnlocked) {
      return res.status(403).json({ error: 'Invalid or expired vault token' });
    }
    req.vaultUnlocked = true;
    next();
  });
}
