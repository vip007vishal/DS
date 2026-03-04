import express from 'express';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import analysisRoutes from './routes/analysis';
import adminRoutes from './routes/admin';
import vaultRoutes from './routes/vault';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/analysis', analysisRoutes);
router.use('/admin', adminRoutes);
router.use('/vault', vaultRoutes);

export default router;
