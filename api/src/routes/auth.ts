import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readJson, writeJson } from '../lib/storage';
import { User, AuditLog } from '../lib/types';
import { hashPassword, comparePassword, generateToken, authenticateToken, AuthRequest } from '../lib/auth';
import { logAction } from '../lib/audit';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { fullName, email, password } = req.body;
  const users = readJson<User[]>('users.json', []);

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser: User = {
    id: uuidv4(),
    fullName,
    email,
    passwordHash: await hashPassword(password),
    role: 'worker',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJson('users.json', users);

  logAction(req, 'USER_REGISTER', 'user', newUser.id, `User registered: ${email}`);
  
  const token = generateToken(newUser);
  res.json({ token, user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = readJson<User[]>('users.json', []);
  const user = users.find(u => u.email === email);

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  logAction(req, 'USER_LOGIN', 'user', user.id, `User logged in: ${email}`);

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
});

router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  const users = readJson<User[]>('users.json', []);
  const user = users.find(u => u.id === req.user?.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
});

export default router;
