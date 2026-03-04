export type Role = 'employee' | 'admin';

export type DocumentStatus = 'queued' | 'processing' | 'done' | 'failed';
export type DocumentType = 'invoice' | 'contract' | 'id' | 'form' | 'other';
export type ValidationStatus = 'valid' | 'needs_review' | 'invalid';

export interface ExtractedField {
  id: string;
  key: string;
  value: string;
  confidence: number;
  isPii: boolean;
  redactedValue?: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  passed: boolean;
  reason?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  docId?: string;
  metadata?: string;
}

export interface Document {
  id: string;
  fileName: string;
  type: DocumentType;
  uploadDate: string;
  status: DocumentStatus;
  confidence: number;
  keyRequired: boolean;
  validationStatus: ValidationStatus;
  fields: ExtractedField[];
  validationRules: ValidationRule[];
  auditLogs: AuditLog[];
  fileSize: string;
  uploader: string;
}

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-001',
    fileName: 'Q3_Vendor_Contract_AcmeCorp.pdf',
    type: 'contract',
    uploadDate: '2026-03-03T10:15:00Z',
    status: 'done',
    confidence: 98.5,
    keyRequired: true,
    validationStatus: 'valid',
    fileSize: '2.4 MB',
    uploader: 'vishal15v2006@gmail.com',
    fields: [
      { id: 'f1', key: 'Vendor Name', value: 'Acme Corp', confidence: 99, isPii: false },
      { id: 'f2', key: 'Contract Value', value: '$150,000', confidence: 98, isPii: false },
      { id: 'f3', key: 'Signatory Name', value: 'Jane Doe', confidence: 95, isPii: true, redactedValue: '[REDACTED NAME]' },
      { id: 'f4', key: 'Signatory Email', value: 'jane.doe@acmecorp.com', confidence: 99, isPii: true, redactedValue: '[REDACTED EMAIL]' },
      { id: 'f5', key: 'Effective Date', value: '2026-04-01', confidence: 97, isPii: false },
    ],
    validationRules: [
      { id: 'v1', name: 'Signature Present', passed: true },
      { id: 'v2', name: 'Date within valid range', passed: true },
      { id: 'v3', name: 'Value matches PO', passed: true },
    ],
    auditLogs: [
      { id: 'a1', timestamp: '2026-03-03T10:15:00Z', user: 'vishal15v2006@gmail.com', action: 'Uploaded Document', docId: 'doc-001' },
      { id: 'a2', timestamp: '2026-03-03T10:15:05Z', user: 'System', action: 'Processing Started', docId: 'doc-001' },
      { id: 'a3', timestamp: '2026-03-03T10:15:45Z', user: 'System', action: 'Processing Completed', docId: 'doc-001' },
    ]
  },
  {
    id: 'doc-002',
    fileName: 'Invoice_INV-8821.pdf',
    type: 'invoice',
    uploadDate: '2026-03-03T11:30:00Z',
    status: 'done',
    confidence: 82.0,
    keyRequired: false,
    validationStatus: 'needs_review',
    fileSize: '1.1 MB',
    uploader: 'vishal15v2006@gmail.com',
    fields: [
      { id: 'f1', key: 'Invoice Number', value: 'INV-8821', confidence: 99, isPii: false },
      { id: 'f2', key: 'Total Amount', value: '$4,520.00', confidence: 85, isPii: false },
      { id: 'f3', key: 'Tax ID', value: 'XX-XXXXXXX', confidence: 65, isPii: true, redactedValue: '[REDACTED TAX ID]' },
    ],
    validationRules: [
      { id: 'v1', name: 'Vendor matched in ERP', passed: true },
      { id: 'v2', name: 'Amount within limits', passed: true },
      { id: 'v3', name: 'Tax ID format valid', passed: false, reason: 'Low confidence extraction, possible OCR error' },
    ],
    auditLogs: [
      { id: 'a1', timestamp: '2026-03-03T11:30:00Z', user: 'vishal15v2006@gmail.com', action: 'Uploaded Document', docId: 'doc-002' },
      { id: 'a2', timestamp: '2026-03-03T11:30:30Z', user: 'System', action: 'Processing Completed with Warnings', docId: 'doc-002' },
    ]
  },
  {
    id: 'doc-003',
    fileName: 'Employee_Onboarding_Form_JSmith.pdf',
    type: 'form',
    uploadDate: '2026-03-02T09:00:00Z',
    status: 'done',
    confidence: 99.5,
    keyRequired: true,
    validationStatus: 'valid',
    fileSize: '3.5 MB',
    uploader: 'hr@company.com',
    fields: [
      { id: 'f1', key: 'Employee Name', value: 'John Smith', confidence: 100, isPii: true, redactedValue: '[REDACTED NAME]' },
      { id: 'f2', key: 'SSN', value: 'XXX-XX-XXXX', confidence: 99, isPii: true, redactedValue: '[REDACTED SSN]' },
      { id: 'f3', key: 'DOB', value: '1990-05-15', confidence: 99, isPii: true, redactedValue: '[REDACTED DOB]' },
      { id: 'f4', key: 'Department', value: 'Engineering', confidence: 100, isPii: false },
    ],
    validationRules: [
      { id: 'v1', name: 'All required fields present', passed: true },
      { id: 'v2', name: 'Signatures verified', passed: true },
    ],
    auditLogs: [
      { id: 'a1', timestamp: '2026-03-02T09:00:00Z', user: 'hr@company.com', action: 'Uploaded Document', docId: 'doc-003' },
      { id: 'a2', timestamp: '2026-03-02T09:01:00Z', user: 'System', action: 'Processing Completed', docId: 'doc-003' },
      { id: 'a3', timestamp: '2026-03-02T10:00:00Z', user: 'admin@company.com', action: 'Viewed Document (Unredacted)', docId: 'doc-003' },
    ]
  },
  {
    id: 'doc-004',
    fileName: 'Unknown_Scan_001.jpg',
    type: 'other',
    uploadDate: '2026-03-03T14:20:00Z',
    status: 'failed',
    confidence: 0,
    keyRequired: false,
    validationStatus: 'invalid',
    fileSize: '5.2 MB',
    uploader: 'vishal15v2006@gmail.com',
    fields: [],
    validationRules: [
      { id: 'v1', name: 'Document readable', passed: false, reason: 'Image too blurry for OCR' },
    ],
    auditLogs: [
      { id: 'a1', timestamp: '2026-03-03T14:20:00Z', user: 'vishal15v2006@gmail.com', action: 'Uploaded Document', docId: 'doc-004' },
      { id: 'a2', timestamp: '2026-03-03T14:20:15Z', user: 'System', action: 'Processing Failed', docId: 'doc-004', metadata: 'Error: OCR_BLURRY_IMAGE' },
    ]
  }
];

export const MOCK_LOGS: AuditLog[] = [
  ...MOCK_DOCUMENTS.flatMap(d => d.auditLogs),
  { id: 'sys-1', timestamp: '2026-03-03T08:00:00Z', user: 'System', action: 'Daily Backup Completed' },
  { id: 'sys-2', timestamp: '2026-03-03T08:05:00Z', user: 'admin@company.com', action: 'Updated Validation Rule: Invoice Amount' },
  { id: 'sys-3', timestamp: '2026-03-03T09:15:00Z', user: 'vishal15v2006@gmail.com', action: 'Logged In' },
].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const MOCK_ACCESS_KEY = 'SECURE-123';
