import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { readJson, writeJson } from "./api/src/lib/storage";
import { User } from "./api/src/lib/types";
import { hashPassword } from "./api/src/lib/auth";

// Routes
import authRoutes from "./api/src/routes/auth";
import docRoutes from "./api/src/routes/documents";
import vaultRoutes from "./api/src/routes/vault";
import adminRoutes from "./api/src/routes/admin";

async function startServer() {
  const app = express();
  const PORT = 5000;

  app.use(cors());
  app.use(express.json());

  // Initialize default admin
  const users = readJson<User[]>('users.json', []);
  if (!users.find(u => u.email === 'admin@local')) {
    const adminUser: User = {
      id: 'admin-1',
      fullName: 'System Admin',
      email: 'admin@local',
      passwordHash: await hashPassword('Admin@1234'),
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    users.push(adminUser);
    writeJson('users.json', users);
    console.log("Default admin created: admin@local / Admin@1234");
  }

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/documents', docRoutes);
  app.use('/api/vault', vaultRoutes);
  app.use('/api/admin', adminRoutes);

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Error:", err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DocShield Lite running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });
}

startServer();
