import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Upload, 
  Lock, 
  ShieldCheck, 
  History, 
  User, 
  LogOut,
  ShieldAlert,
  ShieldX
} from 'lucide-react';

export default function AppShell() {
  const { user, logout, isVaultUnlocked } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Upload', icon: Upload, path: '/upload' },
    { label: 'Files (Locked)', icon: Lock, path: '/files' },
    ...(user?.role === 'admin' ? [{ label: 'Audit Logs', icon: History, path: '/admin/logs' }] : []),
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-zinc-400 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <ShieldCheck className="text-emerald-500" />
            <span>DocShield Lite</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                location.pathname === item.path 
                  ? 'bg-zinc-800 text-white' 
                  : 'hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isVaultUnlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
            }`}>
              {isVaultUnlocked ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
              Vault: {isVaultUnlocked ? 'Unlocked' : 'Locked'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-zinc-900">{user?.fullName}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
            <div className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold rounded uppercase">
              {user?.role}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
