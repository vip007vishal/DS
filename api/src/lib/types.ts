export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'worker' | 'admin';
  vaultKeyHash?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  ownerId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
  latestAnalysisId?: string;
}

export interface AnalysisResult {
  id: string;
  documentId: string;
  ownerId: string;
  createdAt: string;
  geminiRawJson: any;
  normalizedJson: {
    doc_type: string;
    confidence: number;
    ocr_text: string;
    entities: Record<string, any>;
    pii: Array<{ type: string; text: string; score: number }>;
    redactions: Array<{ text: string; replacement: string }>;
    validation: Array<{ rule: string; status: 'pass' | 'fail'; message: string }>;
    errors: string[];
  };
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  details: string;
}
