import { Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <div className="flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-slate-900 p-2 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">SecureDoc AI</span>
          </div>
          <Outlet />
        </div>
      </div>
      <div className="hidden lg:flex flex-col justify-center bg-slate-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/security/1920/1080?blur=10')] opacity-20 mix-blend-overlay" />
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold tracking-tight mb-6">Enterprise-Grade Document Intelligence</h2>
          <p className="text-lg text-slate-300 mb-8">
            Securely extract, redact, and validate data from any document type with our advanced AI pipeline. Built for compliance and scale.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-slate-200">Automated PII Redaction</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
              </div>
              <span className="text-slate-200">Role-Based Access Control</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
              </div>
              <span className="text-slate-200">Immutable Audit Logs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
