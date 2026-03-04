import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  FileJson,
  Table as TableIcon,
  Clock
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/src/components/ui/table";
import { MOCK_ACCESS_KEY, Document } from "@/src/lib/mock-data";
import { getDocument, unlockVault } from "@/src/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";

export function DocumentView({ role = 'employee' }: { role?: 'employee' | 'admin' }) {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [showOriginal, setShowOriginal] = useState(role === 'admin');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [accessKey, setAccessKey] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(role === 'admin');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  useEffect(() => {
    if (docId) {
      getDocument(docId).then(data => {
        // Map backend document to frontend Document interface
        const analysis = data.analysisResults?.[0];
        let fields = [];
        let validationRules = [];
        
        if (analysis) {
          try {
            const extracted = JSON.parse(analysis.extractedJson);
            const pii = JSON.parse(analysis.piiJson);
            const redacted = JSON.parse(analysis.redactedJson);
            
            fields = Object.entries(extracted).map(([key, value]: [string, any], idx) => {
              const piiMatch = pii.find((p: any) => p.text === value || key.toLowerCase().includes(p.type.toLowerCase()));
              const redactedMatch = redacted.find((r: any) => r.text === value);
              
              return {
                id: `f-${idx}`,
                key,
                value: String(value),
                confidence: Math.round((analysis.confidence || 0.95) * 100),
                isPii: !!piiMatch,
                redactedValue: redactedMatch?.replacement || `[REDACTED]`
              };
            });
          } catch (e) {
            console.error("Failed to parse analysis JSON", e);
          }
        }

        const mappedDoc: Document = {
          id: data.id,
          fileName: data.filename,
          type: data.type || 'other',
          uploadDate: data.createdAt,
          status: analysis ? 'done' : 'processing',
          confidence: analysis ? Math.round((analysis.confidence || 0.95) * 100) : 0,
          keyRequired: fields.some(f => f.isPii),
          validationStatus: 'valid',
          fields,
          validationRules: [],
          auditLogs: [],
          fileSize: `${(data.sizeBytes / 1024 / 1024).toFixed(2)} MB`,
          uploader: data.owner?.email || 'unknown'
        };

        setDoc(mappedDoc);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        toast.error("Failed to load document");
        setLoading(false);
      });
    }
  }, [docId]);

  const handleUnlock = async () => {
    try {
      await unlockVault(accessKey);
      setIsUnlocked(true);
      setShowOriginal(true);
      setIsKeyModalOpen(false);
      toast.success("Document unlocked successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 95) return "bg-emerald-100 text-emerald-800";
    if (score >= 80) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading document...</div>;
  }

  if (!doc) {
    return <div className="p-8 text-center text-slate-500">Document not found.</div>;
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              {doc.fileName}
              {doc.keyRequired && !isUnlocked && (
                <ShieldAlert className="h-5 w-5 text-amber-500" />
              )}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <span className="capitalize">{doc.type}</span>
              <span>•</span>
              <span>{format(new Date(doc.uploadDate), "MMM d, yyyy HH:mm")}</span>
              <span>•</span>
              <Badge variant={doc.status === 'done' ? 'success' : 'warning'}>
                {doc.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isUnlocked && doc.keyRequired && (
            <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50">
                  <ShieldAlert className="h-4 w-4" />
                  Reveal Sensitive Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enter Access Key</DialogTitle>
                  <DialogDescription>
                    This document contains protected PII. Enter your authorized access key to view unredacted data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Access Key</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter key (hint: SECURE-123)" 
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsKeyModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleUnlock}>Unlock Document</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        
        {/* Left Column: PDF Viewer Placeholder */}
        <Card className="flex flex-col overflow-hidden bg-slate-100/50 border-slate-200">
          <div className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(Math.max(1, page - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>Page {page} of 3</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(Math.min(3, page + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center relative">
            {/* Mock PDF Document */}
            <div 
              className="bg-white shadow-lg border border-slate-200 w-full max-w-2xl aspect-[1/1.414] relative transition-transform duration-200"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div className="absolute inset-0 p-12 space-y-6">
                <div className="h-8 bg-slate-200 rounded w-1/3 mb-12"></div>
                {doc.fields.map((field, i) => (
                  <div key={i} className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <span className="text-sm font-medium text-slate-500">{field.key}</span>
                    <span className={`text-sm font-mono ${field.isPii && !showOriginal ? 'bg-slate-900 text-slate-900 select-none' : 'text-slate-900'}`}>
                      {field.isPii && !showOriginal ? field.redactedValue : field.value}
                    </span>
                  </div>
                ))}
                <div className="space-y-2 mt-12">
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-100 rounded w-4/6"></div>
                </div>
              </div>
              
              {/* Redaction Overlay Indicator */}
              {!showOriginal && doc.fields.some(f => f.isPii) && (
                <div className="absolute top-4 right-4 bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-purple-200">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  PII REDACTED
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Right Column: Results Studio */}
        <Card className="flex flex-col overflow-hidden">
          <Tabs defaultValue="extracted" className="flex-1 flex flex-col">
            <div className="px-6 pt-4 border-b border-slate-200 shrink-0">
              <TabsList className="w-full justify-start bg-transparent p-0 h-auto space-x-6">
                <TabsTrigger value="extracted" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 pb-3 font-medium">
                  Extracted Data
                </TabsTrigger>
                <TabsTrigger value="redaction" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 pb-3 font-medium">
                  Redaction
                </TabsTrigger>
                <TabsTrigger value="validation" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 pb-3 font-medium">
                  Validation
                </TabsTrigger>
                <TabsTrigger value="audit" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 pb-3 font-medium">
                  Audit Log
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* Extracted Data Tab */}
              <TabsContent value="extracted" className="m-0 h-full flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Extracted Fields</h3>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md">
                    <Button 
                      variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => setViewMode('table')}
                    >
                      <TableIcon className="h-4 w-4 mr-1" /> Table
                    </Button>
                    <Button 
                      variant={viewMode === 'json' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => setViewMode('json')}
                    >
                      <FileJson className="h-4 w-4 mr-1" /> JSON
                    </Button>
                  </div>
                </div>

                {viewMode === 'table' ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Field</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="text-right">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {doc.fields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium text-slate-700">
                              <div className="flex items-center gap-2">
                                {field.key}
                                {field.isPii && <ShieldAlert className="h-3 w-3 text-purple-500" />}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {field.isPii && !showOriginal ? (
                                <span className="text-slate-400 italic">{field.redactedValue}</span>
                              ) : (
                                field.value
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className={getConfidenceColor(field.confidence)}>
                                {field.confidence}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm overflow-auto flex-1">
                    <pre>
                      {JSON.stringify(
                        doc.fields.reduce((acc, f) => ({
                          ...acc,
                          [f.key]: f.isPii && !showOriginal ? f.redactedValue : f.value
                        }), {}),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </TabsContent>

              {/* Redaction Tab */}
              <TabsContent value="redaction" className="m-0 space-y-6">
                <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5" />
                      PII Protection Active
                    </h4>
                    <p className="text-sm text-purple-700 mt-1">
                      {doc.fields.filter(f => f.isPii).length} sensitive fields detected and redacted.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="show-original" className="text-sm font-medium text-purple-900">
                      {showOriginal ? "Showing Original" : "Showing Redacted"}
                    </Label>
                    <Switch 
                      id="show-original" 
                      checked={showOriginal} 
                      onCheckedChange={(checked) => {
                        if (checked && !isUnlocked && doc.keyRequired) {
                          setIsKeyModalOpen(true);
                        } else {
                          setShowOriginal(checked);
                        }
                      }} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Detected PII Fields</h4>
                  <div className="border rounded-md divide-y">
                    {doc.fields.filter(f => f.isPii).map(field => (
                      <div key={field.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{field.key}</p>
                          <p className="text-sm text-slate-500 font-mono mt-1">
                            {showOriginal ? field.value : field.redactedValue}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          PII
                        </Badge>
                      </div>
                    ))}
                    {doc.fields.filter(f => f.isPii).length === 0 && (
                      <div className="p-8 text-center text-slate-500">
                        No PII detected in this document.
                      </div>
                    )}
                  </div>
                </div>

                <Button className="w-full gap-2" variant="outline">
                  <Download className="h-4 w-4" />
                  Download Redacted PDF
                </Button>
              </TabsContent>

              {/* Validation Tab */}
              <TabsContent value="validation" className="m-0 space-y-6">
                <div className={`p-4 rounded-lg border flex items-start gap-4 ${
                  doc.validationStatus === 'valid' ? 'bg-emerald-50 border-emerald-200' :
                  doc.validationStatus === 'needs_review' ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  {doc.validationStatus === 'valid' ? <CheckCircle2 className="h-6 w-6 text-emerald-600 mt-0.5" /> :
                   doc.validationStatus === 'needs_review' ? <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5" /> :
                   <XCircle className="h-6 w-6 text-red-600 mt-0.5" />}
                  <div>
                    <h4 className={`font-semibold ${
                      doc.validationStatus === 'valid' ? 'text-emerald-900' :
                      doc.validationStatus === 'needs_review' ? 'text-amber-900' :
                      'text-red-900'
                    }`}>
                      {doc.validationStatus === 'valid' ? 'Validation Passed' :
                       doc.validationStatus === 'needs_review' ? 'Needs Review' :
                       'Validation Failed'}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      doc.validationStatus === 'valid' ? 'text-emerald-700' :
                      doc.validationStatus === 'needs_review' ? 'text-amber-700' :
                      'text-red-700'
                    }`}>
                      {doc.validationRules.filter(r => r.passed).length} of {doc.validationRules.length} rules passed.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Rule Checks</h4>
                  <div className="border rounded-md divide-y">
                    {doc.validationRules.map(rule => (
                      <div key={rule.id} className="p-4 flex items-start gap-3">
                        {rule.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{rule.name}</p>
                          {!rule.passed && rule.reason && (
                            <p className="text-sm text-red-600 mt-1">{rule.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Audit Tab */}
              <TabsContent value="audit" className="m-0">
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {doc.auditLogs.map((log, i) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-slate-900 text-sm">{log.action}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            {format(new Date(log.timestamp), "HH:mm:ss")}
                          </div>
                        </div>
                        <div className="text-sm text-slate-600">by {log.user}</div>
                        {log.metadata && (
                          <div className="mt-2 text-xs bg-slate-50 p-2 rounded text-slate-500 font-mono">
                            {log.metadata}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
