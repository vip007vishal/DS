/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthLayout } from "./components/layout/AuthLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { EmployeeDashboard } from "./pages/employee/Dashboard";
import { UploadDocument } from "./pages/employee/Upload";
import { Vault } from "./pages/employee/Vault";
import { DocumentView } from "./pages/employee/DocumentView";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminDocuments } from "./pages/admin/Documents";
import { AdminDocumentView } from "./pages/admin/DocumentView";
import { AdminLogs } from "./pages/admin/Logs";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
        </Route>

        <Route path="/employee" element={<DashboardLayout role="employee" />}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="upload" element={<UploadDocument />} />
          <Route path="vault" element={<Vault />} />
          <Route path="view/:docId" element={<DocumentView />} />
        </Route>

        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="view/:docId" element={<AdminDocumentView />} />
          <Route path="logs" element={<AdminLogs />} />
          {/* Optional rules page placeholder */}
          <Route path="rules" element={<div className="p-8 text-center text-slate-500">Rules Configuration (Coming Soon)</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
