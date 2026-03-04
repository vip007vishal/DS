import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import nodemailer from 'nodemailer';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

// In-memory store for OTPs (for demo purposes)
const otpStore = new Map<string, { otp: string, expiresAt: number }>();

// SMTP Transporter
const smtpUser = process.env.SMTP_USER?.replace('@example.com', '@gmail.com');
const smtpFrom = process.env.SMTP_FROM?.replace('@example.com', '@gmail.com');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: smtpUser,
    pass: process.env.SMTP_PASS,
  },
});

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(email, { otp, expiresAt });

  try {
    await transporter.sendMail({
      from: smtpFrom || '"SecureDoc AI" <noreply@securedoc.ai>',
      to: email,
      subject: "Your OTP for SecureDoc AI",
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your verification code is: <strong style="font-size: 24px;">${otp}</strong></p><p>It will expire in 10 minutes.</p>`,
    });
    console.log(`OTP sent to ${email}: ${otp}`);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send OTP email" });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const record = otpStore.get(email);
  if (!record) {
    return res.status(400).json({ error: "No OTP found for this email" });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: "OTP has expired" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  // OTP is valid
  otpStore.delete(email);

  try {
    // Find or create user for demo
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: email.split('@')[0],
          passwordHash: 'demo-password-hash', // Not used for OTP login
          role: email.includes('admin') ? 'admin' : 'worker',
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        fullName: user.fullName, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post('/register', async (req, res) => {
  const { email, password, fullName, role } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: role === 'admin' ? 'admin' : 'worker',
      },
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
