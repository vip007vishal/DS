import { readJson, writeJson } from './storage';
import { AuditLog } from './types';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function logAction(req: Request, action: string, resourceType: string, resourceId?: string, details: string = '') {
  const logs = readJson<AuditLog[]>('audit_logs.json', []);
  const user = (req as any).user;

  const newLog: AuditLog = {
    id: uuidv4(),
    actorUserId: user?.id || 'system',
    actorEmail: user?.email || 'system',
    action,
    resourceType,
    resourceId,
    ip: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    createdAt: new Date().toISOString(),
    details
  };

  logs.unshift(newLog);
  writeJson('audit_logs.json', logs.slice(0, 1000)); // Keep last 1000 logs
}
