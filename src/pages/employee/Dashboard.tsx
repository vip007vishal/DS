import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  Percent, 
  ShieldAlert,
  Plus,
  ArrowRight,
  Search
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/src/components/ui/table";
import { getDocuments } from "@/src/lib/api";
import { Document } from "@/src/lib/mock-data";
import { format } from "date-fns";

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocuments().then(data => {
      const mapped = data.map((d: any) => ({
        id: d.id,
        fileName: d.filename,
        type: d.type || 'other',
        uploadDate: d.createdAt,
        status: d.status || 'done',
        confidence: d.confidence || 0,
        keyRequired: d.keyRequired || false,
        validationStatus: d.validationStatus || 'valid',
        fields: [],
        validationRules: [],
        auditLogs: [],
        fileSize: `${(d.sizeBytes / 1024 / 1024).toFixed(2)} MB`,
        uploader: d.owner?.email || 'unknown'
      }));
      setDocuments(mapped);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const kpis = [
    { title: "Processed Today", value: "14", icon: FileText, color: "text-blue-500" },
    { title: "Pending Review", value: "3", icon: Clock, color: "text-amber-500" },
    { title: "Failed", value: "1", icon: AlertCircle, color: "text-red-500" },
    { title: "Avg Confidence", value: "94.2%", icon: Percent, color: "text-emerald-500" },
    { title: "PII Redacted", value: "42", icon: ShieldAlert, color: "text-purple-500" },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'done': return <Badge variant="success">Done</Badge>;
      case 'processing': return <Badge variant="warning">Processing</Badge>;
      case 'queued': return <Badge variant="secondary">Queued</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getValidationBadge = (status: string) => {
    switch(status) {
      case 'valid': return <Badge variant="success" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Valid</Badge>;
      case 'needs_review': return <Badge variant="warning" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Review</Badge>;
      case 'invalid': return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Invalid</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back. Here's an overview of your document processing.</p>
        </div>
        <Button onClick={() => navigate("/employee/upload")} className="gap-2">
          <Plus className="h-4 w-4" />
          Upload Document
        </Button>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Latest files processed by the AI pipeline.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input type="search" placeholder="Search files..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validation</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Loading documents...
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No documents found. Upload one to get started.
                  </TableCell>
                </TableRow>
              ) : documents.slice(0, 5).map((doc) => (
                <TableRow 
                  key={doc.id} 
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => navigate(`/employee/view/${doc.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      {doc.fileName}
                      {doc.keyRequired && (
                        <ShieldAlert className="h-3 w-3 text-amber-500 ml-1" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{doc.type}</TableCell>
                  <TableCell className="text-slate-500">
                    {format(new Date(doc.uploadDate), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell>{getValidationBadge(doc.validationStatus)}</TableCell>
                  <TableCell className="text-right">
                    <span className={doc.confidence > 90 ? "text-emerald-600 font-medium" : doc.confidence > 70 ? "text-amber-600 font-medium" : "text-red-600 font-medium"}>
                      {doc.confidence > 0 ? `${doc.confidence}%` : '-'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" className="gap-2 text-slate-600" onClick={() => navigate("/employee/vault")}>
              View all documents
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
