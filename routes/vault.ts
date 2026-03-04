import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const VAULT_JWT_SECRET = process.env.VAULT_JWT_SECRET || 'super-secret-vault-key';

router.post('/unlock', authenticate, async (req: AuthRequest, res) => {
  const { securityKey } = req.body;
  if (!securityKey) {
    return res.status(400).json({ error: 'Security key is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.vaultKeyHash) {
      // If no key is set, set it now (for demo purposes)
      const hash = await bcrypt.hash(securityKey, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { vaultKeyHash: hash }
      });
    } else {
      const isValid = await bcrypt.compare(securityKey, user.vaultKeyHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid security key' });
      }
    }

    const token = jwt.sign(
      { id: user.id, vaultUnlocked: true },
      VAULT_JWT_SECRET,
      { expiresIn: '10m' }
    );

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'VAULT_UNLOCKED',
        resourceType: 'VAULT',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Unlocked vault',
      },
    });

    res.json({ token, message: 'Vault unlocked successfully' });
  } catch (error) {
    console.error('Vault unlock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
