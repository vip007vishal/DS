import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Upload, 
  Files, 
  User, 
  LogOut, 
  ShieldCheck, 
  Menu,
  X,
  FileText,
  Activity,
  Settings
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";

interface DashboardLayoutProps {
  role: 'employee' | 'admin';
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const userStr = localStorage.getItem("docshield_user");
  const user = userStr ? JSON.parse(userStr) : null;

  const employeeLinks = [
    { name: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { name: "Upload Document", href: "/employee/upload", icon: Upload },
    { name: "My Vault", href: "/employee/vault", icon: Files },
  ];

  const adminLinks = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "All Documents", href: "/admin/documents", icon: FileText },
    { name: "Audit Logs", href: "/admin/logs", icon: Activity },
    { name: "Access Rules", href: "/admin/rules", icon: Settings },
  ];

  const links = role === 'admin' ? adminLinks : employeeLinks;

  const handleLogout = () => {
    localStorage.removeItem("docshield_token");
    localStorage.removeItem("docshield_user");
    navigate("/auth/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-1.5 rounded-md">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-slate-900">SecureDoc</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:flex items-center gap-2">
          <div className="bg-slate-900 p-2 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">SecureDoc</span>
        </div>

        <div className="px-4 py-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
            {role === 'admin' ? 'Admin Portal' : 'Employee Portal'}
          </div>
          <nav className="space-y-1">
            {links.map((link) => {
              const isActive = location.pathname === link.href || (link.href !== `/${role}` && location.pathname.startsWith(link.href));
              return (
                <NavLink
                  key={link.name}
                  to={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-slate-100 text-slate-900" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <link.icon className={cn("h-5 w-5", isActive ? "text-slate-900" : "text-slate-400")} />
                  {link.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900">
                {user?.fullName || (role === 'admin' ? 'Admin User' : 'Jane Doe')}
              </span>
              <span className="text-xs text-slate-500 capitalize">{role}</span>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-3 text-slate-400" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Topbar */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-slate-200">
          <div className="flex items-center text-sm text-slate-500">
            {/* Breadcrumbs placeholder */}
            <span className="capitalize">{role}</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-900 capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Secure Session Active</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
