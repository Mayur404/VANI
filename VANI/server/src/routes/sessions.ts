import { Router } from "express";

import { prisma } from "../lib/prisma";
import { HttpError, parseDomainFilter, parsePositiveInt } from "../lib/http";

export const sessionsRouter = Router();

sessionsRouter.get("/", async (req, res, next) => {
  try {
    const domain = parseDomainFilter(req.query.domain);
    const take = parsePositiveInt(req.query.limit, 20, "limit", { min: 1, max: 100 });

    const sessions = await prisma.session.findMany({
      where: domain ? { domain } : undefined,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        domain: true,
        mode: true,
        status: true,
        languageDetected: true,
        durationSeconds: true,
        createdAt: true,
        completedAt: true,
        user: {
          select: { id: true, name: true, role: true, organisation: true },
        },
        patient: {
          select: { id: true, name: true, age: true, gender: true },
        },
        customer: {
          select: { id: true, name: true, loanAccountNumber: true },
        },
        _count: {
          select: {
            transcripts: true,
            alerts: true,
            healthcareReports: true,
            financeReports: true,
          },
        },
      },
    });

    res.json({
      filters: {
        domain: domain ?? "all",
        limit: take,
      },
      sessions,
    });
  } catch (error) {
    next(error);
  }
});

sessionsRouter.get("/:id", async (req, res, next) => {
  try {
    const sessionId = Number(req.params.id);

    if (!Number.isInteger(sessionId)) {
      throw new HttpError(400, "Invalid session id");
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
        patient: true,
        customer: true,
        transcripts: { orderBy: { timestampSeconds: "asc" } },
        healthcareReports: true,
        financeReports: true,
        sentimentAnalysis: true,
        alerts: true,
        scheduledCalls: true,
        monitoringPrograms: true,
      },
    });

    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});
