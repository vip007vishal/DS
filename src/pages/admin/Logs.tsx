import { useState, useEffect } from "react";
import { 
  Search, 
  Filter,
  Download,
  Activity
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/src/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { AuditLog } from "@/src/lib/mock-data";
import { getLogs } from "@/src/lib/api";
import { format } from "date-fns";

export function AdminLogs() {
  const [search, setSearch] = useState("");
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

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    (log.docId && log.docId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 mt-1">Immutable record of all system and user activities.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            type="search" 
            placeholder="Search by action, user, or document ID..." 
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2 text-slate-500" />
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="upload">Uploads</SelectItem>
              <SelectItem value="process">Processing</SelectItem>
              <SelectItem value="view">Views</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="7d">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[200px]">Timestamp</TableHead>
              <TableHead>User / System</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Document ID</TableHead>
              <TableHead>Metadata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  Loading logs...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length > 0 ? filteredLogs.map((log) => (
              <TableRow key={log.id} className="hover:bg-slate-50">
                <TableCell className="font-mono text-sm text-slate-600">
                  {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                </TableCell>
                <TableCell className="font-medium text-slate-900">
                  {log.user}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    {log.action}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-500">
                  {log.docId || '-'}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-500 max-w-[200px] truncate">
                  {log.metadata || '-'}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  No logs found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
