import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Search, 
  Filter,
  ShieldAlert,
  Lock,
  Unlock,
  MoreHorizontal,
  Download
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Document } from "@/src/lib/mock-data";
import { getDocuments } from "@/src/lib/api";
import { format } from "date-fns";
import { SecurityKeyPrompt } from "@/src/components/shared/SecurityKeyPrompt";

export function AdminDocuments() {
  const navigate = useNavigate();
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [search, setSearch] = useState("");
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

  const filteredDocs = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
    doc.type.toLowerCase().includes(search.toLowerCase()) ||
    doc.uploader.toLowerCase().includes(search.toLowerCase())
  );

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

  if (!isVaultUnlocked) {
    return (
      <SecurityKeyPrompt 
        onUnlock={() => setIsVaultUnlocked(true)} 
        title="All Documents" 
        description="Enter your admin security key to access the organization's documents." 
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">All Documents</h1>
          <p className="text-slate-500 mt-1">Manage and review all documents across the organization.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            type="search" 
            placeholder="Search by filename, type, or user..." 
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2 text-slate-500" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Validation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Validation</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="needs_review">Needs Review</SelectItem>
              <SelectItem value="invalid">Invalid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Uploader</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Validation</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Access</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
              <TableRow 
                key={doc.id} 
                className="cursor-pointer hover:bg-slate-50 group"
                onClick={() => navigate(`/admin/view/${doc.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${doc.keyRequired ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span>{doc.fileName}</span>
                      <span className="text-xs text-slate-500 capitalize">{doc.type}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 text-sm">{doc.uploader}</TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {format(new Date(doc.uploadDate), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell>{getValidationBadge(doc.validationStatus)}</TableCell>
                <TableCell>
                  <span className={doc.confidence > 90 ? "text-emerald-600 font-medium" : doc.confidence > 70 ? "text-amber-600 font-medium" : "text-red-600 font-medium"}>
                    {doc.confidence > 0 ? `${doc.confidence}%` : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  {doc.keyRequired ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                      <Lock className="h-3 w-3" /> Protected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1">
                      <Unlock className="h-3 w-3" /> Open
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                  No documents found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
