import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';
import { 
  Lock, 
  ShieldCheck, 
  Key, 
  Loader2, 
  FileText, 
  Download, 
  Eye,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { formatDate } from '../lib/utils';

export default function FilesLocked() {
  const { token, vaultToken, setVaultToken, isVaultUnlocked } = useAuth();
  const [securityKey, setSecurityKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isVaultUnlocked && token && vaultToken) {
      api.vault.listFiles(token, vaultToken)
        .then(setFiles)
        .catch(() => setVaultToken(null));
    }
  }, [isVaultUnlocked, token, vaultToken, setVaultToken]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.vault.unlock(token, securityKey);
      setVaultToken(res.vaultToken);
    } catch (err: any) {
      setError(err.error || 'Unlock failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isVaultUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Secure Vault</h1>
          <p className="text-zinc-500 mb-8">Enter your security key to access sensitive documents.</p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="password"
                required
                value={securityKey}
                onChange={(e) => setSecurityKey(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                placeholder="Enter Security Key"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Unlock Vault'}
            </button>
          </form>
          <p className="mt-6 text-xs text-zinc-400">
            Forgot your key? Reset it in your profile settings.
          </p>
        </div>
      </div>
    );
  }

  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
            <ShieldCheck className="text-emerald-600" size={32} /> Secure Vault
          </h1>
          <p className="text-zinc-500 mt-1">Accessing high-security document repository.</p>
        </div>
        <button 
          onClick={() => setVaultToken(null)}
          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-sm transition-all"
        >
          Lock Vault
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">All Sensitive Files</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text"
              placeholder="Search vault..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Filename</th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredFiles.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400">No files in vault</td></tr>
              ) : (
                filteredFiles.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="text-zinc-400" size={18} />
                        <span className="text-sm font-bold text-zinc-900">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {doc.ownerId}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {formatDate(doc.createdAt || doc.uploadedAt, 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.latestAnalysisId && (
                          <Link to={`/analysis/${doc.latestAnalysisId}`} className="p-2 text-zinc-400 hover:text-zinc-900">
                            <Eye size={18} />
                          </Link>
                        )}
                        <a href={api.docs.downloadUrl(doc.id, token!)} className="p-2 text-zinc-400 hover:text-zinc-900">
                          <Download size={18} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
