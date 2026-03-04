// server/api/index.ts
import type { Express } from "express";

// NOTE: routes are located at server/routes/*
import authRoutes from "../routes/auth";
import documentRoutes from "../routes/documents";
import analysisRoutes from "../routes/analysis";
import adminRoutes from "../routes/admin";
import vaultRoutes from "../routes/vault";

export function mountApi(app: Express) {
  app.use("/auth", authRoutes);
  app.use("/documents", documentRoutes);
  app.use("/analyze", analysisRoutes); // if your analysis route expects /analyze
  app.use("/admin", adminRoutes);
  app.use("/vault", vaultRoutes);

  app.get("/health", (_req, res) => res.json({ ok: true }));
}