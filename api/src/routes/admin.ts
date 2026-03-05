import express from 'express';
import { readJson } from '../lib/storage';
import { AuditLog } from '../lib/types';
import { authenticateToken, requireAdmin, AuthRequest } from '../lib/auth';

const router = express.Router();

router.get('/logs', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  const logs = readJson<AuditLog[]>('audit_logs.json', []);
  res.json(logs);
});

export default router;
