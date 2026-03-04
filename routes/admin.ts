import express from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/audit-logs', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 10, action, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (action) {
      whereClause.action = String(action);
    }
    if (userId) {
      whereClause.actorUserId = String(userId);
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { fullName: true, email: true } } },
    });

    const total = await prisma.auditLog.count({ where: whereClause });

    res.json({ data: logs, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
