import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Users, 
  AlertTriangle, 
  ShieldAlert,
  Activity,
  ArrowRight
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/src/components/ui/table";
import { AuditLog } from "@/src/lib/mock-data";
import { getLogs } from "@/src/lib/api";
import { format } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const processingData = [
  { name: 'Mon', docs: 120 },
  { name: 'Tue', docs: 150 },
  { name: 'Wed', docs: 180 },
  { name: 'Thu', docs: 140 },
  { name: 'Fri', docs: 210 },
  { name: 'Sat', docs: 50 },
  { name: 'Sun', docs: 80 },
];

const failureData = [
  { name: 'Blurry Image', count: 45 },
  { name: 'Missing Signature', count: 30 },
  { name: 'Invalid Date', count: 15 },
  { name: 'Unknown Format', count: 10 },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLogs().then(data => {
      const mapped = data.map((l: any) => ({
        id: l.id,
        timestamp: l.createdAt,
        user: l.actor?.fullName || l.actor?.email || 'System',
        action: l.action,
        docId: l.resourceId,
        metadata: l.details
      }));
      setLogs(mapped);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const kpis = [
    { title: "Total Documents", value: "1,248", icon: FileText, color: "text-blue-500" },
    { title: "Pending Review", value: "42", icon: AlertTriangle, color: "text-amber-500" },
    { title: "Validation Failures", value: "18", icon: Activity, color: "text-red-500" },
    { title: "PII Redactions", value: "3,892", icon: ShieldAlert, color: "text-purple-500" },
    { title: "Active Users", value: "156", icon: Users, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Overview</h1>
          <p className="text-slate-500 mt-1">System-wide metrics and recent activity.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/logs")}>
            View Audit Logs
          </Button>
          <Button onClick={() => navigate("/admin/documents")}>
            Manage Documents
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-x-2">
                <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div className="mt-4 flex items-baseline text-3xl font-bold text-slate-900">
                {kpi.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Processing Volume</CardTitle>
            <CardDescription>Documents processed over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="docs" stroke="#0f172a" strokeWidth={2} dot={{ r: 4, fill: '#0f172a' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validation Failure Reasons</CardTitle>
            <CardDescription>Top reasons for document rejection.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={failureData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Recent System Activity</CardTitle>
            <CardDescription>Latest actions across the platform.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Document ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : logs.slice(0, 5).map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50">
                  <TableCell className="text-slate-500 font-mono text-sm">
                    {format(new Date(log.timestamp), "MMM d, HH:mm:ss")}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">
                    {log.docId || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" className="gap-2 text-slate-600" onClick={() => navigate("/admin/logs")}>
              View all logs
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
