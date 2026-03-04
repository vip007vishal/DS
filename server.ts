import express from "express";
import { createServer as createViteServer } from "vite";
import apiRouter from "./server/api/index";
import dotenv from "dotenv";
import fs from "fs";

// Load .env.example as a fallback if .env doesn't exist or variables aren't set
if (fs.existsSync(".env.example")) {
  const envConfig = dotenv.parse(fs.readFileSync(".env.example"));
  for (const k in envConfig) {
    if (!process.env[k]) {
      process.env[k] = envConfig[k];
    }
  }
}

// In-memory store for OTPs (for demo purposes)
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Use the new API router
  app.use('/api', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
