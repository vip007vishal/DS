import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';
import { Key, ShieldCheck, Loader2, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, token, setVaultToken } = useAuth();
  const [securityKey, setSecurityKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSetKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.vault.setKey(token, securityKey);
      setMessage('Security key updated successfully!');
      setSecurityKey('');
    } catch (err: any) {
      setError(err.error || 'Failed to update key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">User Profile</h1>
        <p className="text-zinc-500">Manage your account and security settings.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-zinc-900 text-white rounded-3xl flex items-center justify-center font-bold text-3xl">
            {user?.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{user?.fullName}</h2>
            <p className="text-zinc-500">{user?.email}</p>
            <span className="mt-2 inline-block px-2 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-bold rounded uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center">
            <Key size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Vault Security Key</h2>
            <p className="text-sm text-zinc-500">Set or update your key to access the secure vault.</p>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-xl flex items-center gap-2">
            <ShieldCheck size={18} />
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSetKey} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">New Security Key</label>
            <input
              type="password"
              required
              value={securityKey}
              onChange={(e) => setSecurityKey(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
              placeholder="Enter new key"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Security Key'}
          </button>
        </form>

        <div className="pt-6 border-t border-zinc-100">
          <button 
            onClick={() => setVaultToken(null)}
            className="flex items-center gap-2 text-sm font-bold text-red-500 hover:underline"
          >
            <LogOut size={16} /> Clear Vault Session
          </button>
        </div>
      </div>
    </div>
  );
}
