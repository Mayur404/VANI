import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { createServer } from "http";

import { env } from "./config/env";
import { analyticsRouter } from "./routes/analytics";
import { dashboardRouter } from "./routes/dashboard";
import { healthRouter } from "./routes/health";
import { searchRouter } from "./routes/search";
import { sessionsRouter } from "./routes/sessions";
import { HttpError } from "./lib/http";
import { setupWebRTCSignaling } from "./lib/webrtc-signaling";
import { setupAICall } from "./lib/ai-call";

export const app = express();
export const server = createServer(app);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "VANI API",
    version: "0.1.0",
    docs: {
      health: "/api/health",
      dashboard: "/api/dashboard/summary",
      sessions: "/api/sessions",
      searchPatients: "/api/search/patients?q=ravi",
      searchCustomers: "/api/search/customers?q=loan",
      analytics: "/api/analytics/overview",
    },
  });
});

app.use("/api/health", healthRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/search", searchRouter);
app.use("/api/analytics", analyticsRouter);

// Setup AI call and WebRTC signaling (after routes to avoid conflicts)
setupWebRTCSignaling(server, app);
setupAICall(server, app);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details ?? null,
    });
  }

  res.status(500).json({
    error: "Internal server error",
  });
});
