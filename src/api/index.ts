const API_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const handleResponse = async (r: Response) => {
  const contentType = r.headers.get('content-type');
  if (r.ok) {
    if (contentType && contentType.includes('application/json')) {
      return r.json();
    }
    return r.text();
  } else {
    if (contentType && contentType.includes('application/json')) {
      const error = await r.json();
      return Promise.reject(error);
    }
    const errorText = await r.text();
    return Promise.reject({ error: `Server error (${r.status}): ${errorText.substring(0, 100)}` });
  }
};

export const api = {
  auth: {
    login: (data: any) => fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
    
    register: (data: any) => fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
    
    me: (token: string) => fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleResponse),
  },
  
  docs: {
    list: (token: string) => fetch(`${API_URL}/documents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleResponse),
    
    upload: (token: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }).then(handleResponse);
    },
    
    analyze: (token: string, documentId: string, result: any) => fetch(`${API_URL}/documents/analyze`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId, result })
    }).then(handleResponse),
    
    getAnalysis: (token: string, id: string) => fetch(`${API_URL}/documents/analysis/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleResponse),
    
    downloadUrl: (id: string, token: string) => `${API_URL}/documents/${id}/download?token=${token}`
  },
  
  vault: {
    setKey: (token: string, securityKey: string) => fetch(`${API_URL}/vault/set-key`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ securityKey })
    }).then(handleResponse),
    
    unlock: (token: string, securityKey: string) => fetch(`${API_URL}/vault/unlock`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ securityKey })
    }).then(handleResponse),
    
    listFiles: (token: string, vaultToken: string) => fetch(`${API_URL}/vault/files`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'x-vault-token': vaultToken
      }
    }).then(handleResponse),
  },
  
  admin: {
    getLogs: (token: string) => fetch(`${API_URL}/admin/logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleResponse),
  }
};
