import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

import { readJson, writeJson, UPLOADS_DIR } from '../lib/storage';
import { Document, AnalysisResult } from '../lib/types';
import { authenticateToken, AuthRequest } from '../lib/auth';
import { logAction } from '../lib/audit';

const router = express.Router();
const upload = multer({ 
  dest: UPLOADS_DIR,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      console.error("Upload failed: No file in request");
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const doc: Document = {
      id: uuidv4(),
      ownerId: req.user!.id,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      sizeBytes: req.file.size,
      storagePath: req.file.path,
      createdAt: new Date().toISOString()
    };

    const docs = readJson<Document[]>('documents.json', []);
    docs.push(doc);
    writeJson('documents.json', docs);

    logAction(req, 'DOC_UPLOAD', 'document', doc.id, `Uploaded: ${doc.filename}`);
    console.log(`Document uploaded successfully: ${doc.filename} (${doc.id})`);

    res.json(doc);
  } catch (error: any) {
    console.error("Upload route error:", error);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
});

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const docs = readJson<Document[]>('documents.json', []);
  if (req.user?.role === 'admin') {
    res.json(docs);
  } else {
    res.json(docs.filter(d => d.ownerId === req.user?.id));
  }
});

router.get('/:id/download', authenticateToken, (req: AuthRequest, res) => {
  const docs = readJson<Document[]>('documents.json', []);
  const doc = docs.find(d => d.id === req.params.id);

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (req.user?.role !== 'admin' && doc.ownerId !== req.user?.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.download(doc.storagePath, doc.filename);
});

router.post('/analyze', authenticateToken, async (req: AuthRequest, res) => {
  const { documentId, result } = req.body;
  const docs = readJson<Document[]>('documents.json', []);
  const doc = docs.find(d => d.id === documentId);

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  
  try {
    // Analysis is now performed on the frontend as per platform guidelines.
    // The backend just stores the result.
    if (!result) {
      return res.status(400).json({ error: 'Analysis result is required' });
    }

    const analysis: AnalysisResult = {
      id: uuidv4(),
      documentId: doc.id,
      ownerId: req.user!.id,
      createdAt: new Date().toISOString(),
      geminiRawJson: result,
      normalizedJson: result
    };

    const analyses = readJson<AnalysisResult[]>('analysis_results.json', []);
    analyses.push(analysis);
    writeJson('analysis_results.json', analyses);

    // Update doc with latest analysis
    doc.latestAnalysisId = analysis.id;
    writeJson('documents.json', docs);

    logAction(req, 'DOC_ANALYZE', 'analysis', analysis.id, `Analyzed: ${doc.filename}`);

    res.json(analysis);
  } catch (error: any) {
    console.error("Save analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/analysis/:id', authenticateToken, (req: AuthRequest, res) => {
  const analyses = readJson<AnalysisResult[]>('analysis_results.json', []);
  const analysis = analyses.find(a => a.id === req.params.id || a.documentId === req.params.id);

  if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
  if (req.user?.role !== 'admin' && analysis.ownerId !== req.user?.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(analysis);
});

export default router;
