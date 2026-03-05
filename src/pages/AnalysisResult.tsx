import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  RefreshCw,
  Eye,
  EyeOff,
  Database,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { formatDate } from '../lib/utils';
import { analyzeWithGemini } from '../services/gemini';

export default function AnalysisResult() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pii' | 'raw'>('overview');
  const [showRedacted, setShowRedacted] = useState(false);

  useEffect(() => {
    if (token && id) {
      api.docs.getAnalysis(token, id)
        .then(setAnalysis)
        .finally(() => setLoading(false));
    }
  }, [token, id]);

  const handleReRun = async () => {
    if (!token || !analysis) return;
    setLoading(true);
    try {
      // 1. Fetch the original document as a blob
      const downloadUrl = api.docs.downloadUrl(analysis.documentId, token);
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to fetch document for re-analysis');
      const blob = await response.blob();
      
      // 2. Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });

      // 3. Call Gemini from frontend
      const geminiResult = await analyzeWithGemini({
        inlineData: {
          data: base64,
          mimeType: blob.type
        }
      });

      // 4. Save result to backend
      const res = await api.docs.analyze(token, analysis.documentId, geminiResult);
      setAnalysis(res);
      navigate(`/analysis/${res.id}`);
    } catch (err: any) {
      console.error("Re-run analysis error:", err);
      alert('Analysis failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
  
  if (!analysis || analysis.error) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Analysis Failed</h1>
          <p className="text-zinc-500 mt-2">{analysis?.error || 'Analysis not found or could not be loaded.'}</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const result = analysis.normalizedJson;
  if (!result) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6">
        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Incomplete Data</h1>
          <p className="text-zinc-500 mt-2">The analysis completed but returned no structured data.</p>
        </div>
        <button 
          onClick={handleReRun}
          className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Analysis Result</h1>
          <p className="text-zinc-500">Intelligence extracted from document</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleReRun}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-all"
          >
            <RefreshCw size={18} /> Re-run Analysis
          </button>
          <a 
            href={api.docs.downloadUrl(analysis.documentId, token!)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all"
          >
            <Download size={18} /> Download Original
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl w-fit">
            {(['overview', 'pii', 'raw'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  activeTab === tab ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-8">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Document Type</h3>
                    <p className="text-2xl font-bold text-zinc-900 capitalize">{result.doc_type}</p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Confidence Score</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500" 
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-emerald-600">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Extracted Entities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(result.entities).map(([key, value]) => (
                      <div key={key} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-bold text-zinc-900">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pii' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">PII Detection & Redaction</h3>
                  <button 
                    onClick={() => setShowRedacted(!showRedacted)}
                    className="flex items-center gap-2 px-3 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold text-zinc-700 transition-all"
                  >
                    {showRedacted ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showRedacted ? 'Hide Redaction' : 'Preview Redaction'}
                  </button>
                </div>

                <div className="p-6 bg-zinc-900 rounded-2xl text-zinc-300 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-auto">
                  {showRedacted ? (
                    result.ocr_text.split('\n').map((line: string) => {
                      let newLine = line;
                      result.redactions.forEach((r: any) => {
                        newLine = newLine.replace(r.text, r.replacement);
                      });
                      return newLine;
                    }).join('\n')
                  ) : (
                    result.ocr_text
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.pii.map((item: any, i: number) => (
                    <div key={i} className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{item.type}</p>
                        <p className="text-sm font-bold text-zinc-900">{item.text}</p>
                      </div>
                      <AlertTriangle className="text-orange-400" size={18} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'raw' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Raw Gemini Response</h3>
                <pre className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs font-mono text-zinc-700 overflow-auto max-h-[500px]">
                  {JSON.stringify(analysis.geminiRawJson, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Database size={16} className="text-blue-500" /> Metadata
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Analyzed At</span>
                <span className="font-bold text-zinc-900">{formatDate(analysis.createdAt, 'MMM d, HH:mm')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Document ID</span>
                <span className="font-bold text-zinc-900 truncate max-w-[100px]">{analysis.documentId}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" /> Validation
            </h3>
            <div className="space-y-3">
              {result.validation.map((v: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full ${v.status === 'pass' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-xs font-bold text-zinc-900">{v.rule}</p>
                    <p className="text-[10px] text-zinc-500">{v.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
