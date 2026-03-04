import { Document, AuditLog } from './mock-data';

const getAuthHeaders = () => {
  const token = localStorage.getItem("docshield_token");
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export async function getDocuments(): Promise<any[]> {
  const res = await fetch('/api/documents', {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch documents');
  const data = await res.json();
  return data.data || data; // Handle both paginated and non-paginated responses
}

export async function getDocument(id: string): Promise<any> {
  const res = await fetch(`/api/documents/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch document');
  return res.json();
}

export async function uploadDocument(file: File, uploader: string): Promise<{ success: boolean, docId: string }> {
  const token = localStorage.getItem("docshield_token");
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploader', uploader);

  const res = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });
  
  if (!res.ok) throw new Error('Failed to upload document');
  const data = await res.json();
  return { success: true, docId: data.id };
}

export async function analyzeDocument(documentId: string): Promise<any> {
  const res = await fetch('/api/analysis', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ documentId }),
  });
  if (!res.ok) throw new Error('Failed to analyze document');
  return res.json();
}

export async function unlockVault(securityKey: string): Promise<{ token: string }> {
  const res = await fetch('/api/vault/unlock', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ securityKey }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to unlock vault');
  }
  return res.json();
}

export async function getLogs(): Promise<AuditLog[]> {
  const res = await fetch('/api/admin/audit-logs', {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch logs');
  const data = await res.json();
  return data.data || data;
}
