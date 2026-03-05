import express from 'express';
import { readJson, writeJson } from '../lib/storage';
import { User, Document } from '../lib/types';
import { authenticateToken, AuthRequest, hashPassword, comparePassword, generateVaultToken, authenticateVault } from '../lib/auth';
import { logAction } from '../lib/audit';

const router = express.Router();

router.post('/set-key', authenticateToken, async (req: AuthRequest, res) => {
  const { securityKey } = req.body;
  const users = readJson<User[]>('users.json', []);
  const userIndex = users.findIndex(u => u.id === req.user?.id);

  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  users[userIndex].vaultKeyHash = await hashPassword(securityKey);
  writeJson('users.json', users);

  logAction(req, 'VAULT_SET_KEY', 'user', req.user?.id, 'Updated vault security key');
  res.json({ success: true });
});

router.post('/unlock', authenticateToken, async (req: AuthRequest, res) => {
  const { securityKey } = req.body;
  const users = readJson<User[]>('users.json', []);
  const user = users.find(u => u.id === req.user?.id);

  if (!user || !user.vaultKeyHash) {
    return res.status(400).json({ error: 'Vault key not set' });
  }

  if (!(await comparePassword(securityKey, user.vaultKeyHash))) {
    return res.status(401).json({ error: 'Invalid security key' });
  }

  const vaultToken = generateVaultToken(user.id);
  logAction(req, 'VAULT_UNLOCK', 'vault', user.id, 'Unlocked secure vault');
  
  res.json({ vaultToken });
});

router.get('/files', authenticateToken, authenticateVault, (req: AuthRequest, res) => {
  if (!req.vaultUnlocked) {
    return res.status(403).json({ error: 'Vault is locked' });
  }

  const docs = readJson<Document[]>('documents.json', []);
  if (req.user?.role === 'admin') {
    res.json(docs);
  } else {
    res.json(docs.filter(d => d.ownerId === req.user?.id));
  }
});

export default router;
