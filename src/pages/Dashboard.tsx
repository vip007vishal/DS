import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Search,
  Plus,
  ArrowRight,
  Database,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, formatBytes } from '../lib/utils';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, analyzed: 0, pii: 0, size: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (token) {
      api.docs.list(token).then(data => {
        setDocs(data);
        const analyzed = data.filter((d: any) => d.latestAnalysisId).length;
        const totalSize = data.reduce((acc: number, d: any) => acc + (d.sizeBytes || d.size || 0), 0);
        setStats({
          total: data.length,
          analyzed,
          pii: 0, // This would ideally come from a separate endpoint or aggregated data
          size: totalSize
        });
        setLoading(false);
      });
    }
  }, [token]);

  const filteredDocs = docs.filter(d => 
    d.filename.toLowerCase().includes(search.toLowerCase()) ||
    (d.originalName && d.originalName.toLowerCase().includes(search.toLowerCase()))
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight">
            Welcome back, <span className="text-zinc-500">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-zinc-500 font-medium">DocShield Intelligence Hub • {formatDate(new Date(), 'EEEE, MMMM do')}</p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/upload" 
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 active:scale-95"
          >
            <Plus size={20} /> Upload Document
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Files', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Analyzed', value: stats.analyzed, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Storage', value: formatBytes(stats.size), icon: Database, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Security Alerts', value: stats.pii, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="bg-white p-6 rounded-3xl border border-zinc-200 hover:border-zinc-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon size={24} />
              </div>
              <div className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Live Status</div>
            </div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-zinc-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
                <Clock size={16} />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Recent Activity</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none w-full sm:w-64 transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50/50 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Uploaded</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-400 font-medium">Loading intelligence...</td></tr>
                ) : filteredDocs.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-400 font-medium">No documents matching your search</td></tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:text-zinc-900 transition-colors">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">{doc.filename}</p>
                            <p className="text-[10px] text-zinc-400 font-medium">{formatBytes(doc.sizeBytes || doc.size || 0)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 font-medium">
                        {formatDate(doc.createdAt || doc.uploadedAt, 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          doc.latestAnalysisId 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${doc.latestAnalysisId ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {doc.latestAnalysisId ? 'Analyzed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {doc.latestAnalysisId ? (
                          <Link 
                            to={`/analysis/${doc.latestAnalysisId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all"
                          >
                            View Result <ExternalLink size={12} />
                          </Link>
                        ) : (
                          <span className="text-zinc-300 text-xs font-bold italic">Awaiting Analysis</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 p-8 rounded-3xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Secure Vault</h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Store highly sensitive documents in our encrypted vault with secondary authentication.
              </p>
              <Link 
                to="/vault"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 font-bold rounded-2xl hover:bg-zinc-100 transition-all active:scale-95"
              >
                Access Vault <ArrowRight size={18} />
              </Link>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <ShieldCheck size={160} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-200">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/upload" className="p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-all text-center group">
                <Plus className="mx-auto mb-2 text-zinc-400 group-hover:text-zinc-900 transition-colors" size={20} />
                <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors">New Upload</span>
              </Link>
              <Link to="/profile" className="p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-all text-center group">
                <ShieldCheck className="mx-auto mb-2 text-zinc-400 group-hover:text-zinc-900 transition-colors" size={20} />
                <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors">Security</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
