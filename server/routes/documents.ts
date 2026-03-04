import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'data', 'uploads');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, STORAGE_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage });

router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = await prisma.document.create({
      data: {
        ownerId: req.user!.id,
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        sizeBytes: req.file.size,
        storagePath: req.file.path,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'DOCUMENT_UPLOAD',
        resourceType: 'DOCUMENT',
        resourceId: document.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: `Uploaded file ${document.filename}`,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (req.user!.role !== 'admin') {
      whereClause.ownerId = req.user!.id;
    }
    if (search) {
      whereClause.filename = { contains: String(search) };
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { fullName: true, email: true } } },
    });

    const total = await prisma.document.count({ where: whereClause });

    res.json({ data: documents, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { 
        owner: { select: { fullName: true, email: true } },
        analysisResults: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (req.user!.role !== 'admin' && document.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
