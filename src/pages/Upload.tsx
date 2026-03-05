import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';
import { Upload as UploadIcon, FileText, Loader2, CheckCircle2 } from 'lucide-react';

import { analyzeWithGemini } from '../services/gemini';

export default function Upload() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data:mime/type;base64, prefix
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!file || !token) return;
    
    setStatus('uploading');
    try {
      // 1. Upload file to backend
      const doc = await api.docs.upload(token, file);
      
      setStatus('analyzing');
      
      // 2. Prepare content for Gemini
      const base64 = await fileToBase64(file);
      const content = {
        inlineData: {
          data: base64,
          mimeType: file.type
        }
      };

      // 3. Call Gemini from frontend
      const geminiResult = await analyzeWithGemini(content);

      // 4. Send result to backend to save
      const analysis = await api.docs.analyze(token, doc.id, geminiResult);
      
      setStatus('done');
      setTimeout(() => {
        navigate(`/analysis/${analysis.id}`);
      }, 1000);
    } catch (err: any) {
      console.error("Upload process error:", err);
      setError(err.error || err.message || 'An unexpected error occurred during upload or analysis.');
      setStatus('idle');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Upload Document</h1>
        <p className="text-zinc-500">Securely upload and analyze your documents for PII and sensitive data.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
        {status === 'idle' ? (
          <div className="space-y-6">
            <div 
              className="border-2 border-dashed border-zinc-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-zinc-400 transition-all cursor-pointer bg-zinc-50"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-zinc-400">
                <UploadIcon size={32} />
              </div>
              <div className="text-center">
                <p className="font-bold text-zinc-900">Click to upload or drag and drop</p>
                <p className="text-sm text-zinc-500">PDF, JPG, PNG up to 10MB</p>
              </div>
              <input 
                id="file-input"
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>

            {file && (
              <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <FileText className="text-zinc-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-900">{file.name}</p>
                  <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            <button
              disabled={!file}
              onClick={handleUpload}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Upload & Analyze
            </button>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center gap-6">
            {status === 'done' ? (
              <CheckCircle2 size={64} className="text-emerald-500 animate-bounce" />
            ) : (
              <Loader2 size={64} className="text-zinc-900 animate-spin" />
            )}
            <div className="text-center">
              <h2 className="text-xl font-bold text-zinc-900 capitalize">{status}...</h2>
              <p className="text-zinc-500">
                {status === 'uploading' && 'Transferring file to secure storage'}
                {status === 'analyzing' && 'Gemini AI is processing your document'}
                {status === 'done' && 'Analysis complete! Redirecting...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
