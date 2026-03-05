import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { readJson } from './storage';
import { User } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'docshield-secret-key';
const VAULT_JWT_SECRET = process.env.VAULT_JWT_SECRET || 'docshield-vault-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  vaultUnlocked?: boolean;
}

export const generateToken = (user: User) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
};

export const generateVaultToken = (userId: string) => {
  return jwt.sign({ userId, unlocked: true }, VAULT_JWT_SECRET, { expiresIn: '10m' });
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const authenticateVault = (req: AuthRequest, res: Response, next: NextFunction) => {
  const vaultToken = req.headers['x-vault-token'] as string;
  
  if (!vaultToken) {
    req.vaultUnlocked = false;
    return next();
  }

  jwt.verify(vaultToken, VAULT_JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      req.vaultUnlocked = false;
    } else {
      req.vaultUnlocked = true;
    }
    next();
  });
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};
