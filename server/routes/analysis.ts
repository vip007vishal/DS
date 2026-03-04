import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.error("Failed to initialize Gemini API", e);
}

const geminiSchema = {
  type: Type.OBJECT,
  properties: {
    doc_type: { type: Type.STRING, description: "invoice|contract|form|id|other" },
    confidence: { type: Type.NUMBER, description: "0-1" },
    entities: { type: Type.OBJECT, description: "Key-value pairs extracted" },
    pii: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "EMAIL|PHONE|NAME|ID|ADDRESS|DOB|PAN|AADHAAR" },
          text: { type: Type.STRING },
          start: { type: Type.INTEGER },
          end: { type: Type.INTEGER },
          score: { type: Type.NUMBER, description: "0-1" }
        },
        required: ["type", "text", "score"]
      }
    },
    redactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          replacement: { type: Type.STRING, description: "[REDACTED:TYPE]" }
        },
        required: ["text", "replacement"]
      }
    },
    validation: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rule: { type: Type.STRING },
          status: { type: Type.STRING, description: "pass|fail" },
          message: { type: Type.STRING }
        },
        required: ["rule", "status"]
      }
    }
  },
  required: ["doc_type", "confidence", "entities", "pii", "redactions", "validation"]
};

router.post('/', authenticate, async (req: AuthRequest, res) => {
  const { documentId } = req.body;
  if (!documentId) {
    return res.status(400).json({ error: 'documentId is required' });
  }

  try {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (req.user!.role !== 'admin' && document.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    const fileBuffer = fs.readFileSync(document.storagePath);
    let extractedText = '';

    if (document.contentType === 'application/pdf') {
      try {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } catch (err) {
        console.error('PDF parse error:', err);
      }
    }

    const parts: any[] = [];
    if (extractedText) {
      parts.push({ text: `Analyze the following document text:\n\n${extractedText}` });
    } else {
      parts.push({
        inlineData: {
          mimeType: document.contentType,
          data: fileBuffer.toString('base64')
        }
      });
      parts.push({ text: "Analyze this document image." });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: geminiSchema,
      }
    });

    const geminiRawJson = response.text || "{}";
    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(geminiRawJson);
    } catch (e) {
      console.error("Failed to parse Gemini JSON", e);
    }

    const analysisResult = await prisma.analysisResult.create({
      data: {
        documentId: document.id,
        ownerId: document.ownerId,
        geminiRawJson,
        extractedJson: JSON.stringify(parsedResult.entities || {}),
        piiJson: JSON.stringify(parsedResult.pii || []),
        redactedJson: JSON.stringify(parsedResult.redactions || []),
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'DOCUMENT_ANALYSIS',
        resourceType: 'DOCUMENT',
        resourceId: document.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: `Analyzed document ${document.filename}`,
      },
    });

    res.json(analysisResult);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const analysis = await prisma.analysisResult.findUnique({
      where: { id: req.params.id },
      include: { document: true }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    if (req.user!.role !== 'admin' && analysis.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
