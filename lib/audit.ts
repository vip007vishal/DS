import { readJson, writeJson } from './fileStore';

export interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  docId?: string;
  time: string;
  ip: string;
  userAgent: string;
  details: string;
}

export function logAction(log: Omit<AuditLog, 'id' | 'time'>) {
  const logs = readJson<AuditLog>('audit_logs.json');
  const newLog: AuditLog = {
    ...log,
    id: Math.random().toString(36).substring(7),
    time: new Date().toISOString()
  };
  logs.push(newLog);
  writeJson('audit_logs.json', logs);
}
