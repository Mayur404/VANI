import { Router } from "express";

import { prisma } from "../lib/prisma";
import { parseDateRangeFilters } from "../lib/http";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (req, res, next) => {
  try {
    const { domain, days, where } = parseDateRangeFilters(req);

    const [totalSessions, completedSessions, pendingReviewSessions, modeCounts, avgDuration, criticalAlerts, languageGroups] =
      await Promise.all([
        prisma.session.count({ where }),
        prisma.session.count({
          where: {
            ...where,
            status: {
              in: ["completed", "approved"],
            },
          },
        }),
        prisma.session.count({
          where: {
            ...where,
            status: "pending_review",
          },
        }),
        prisma.session.groupBy({
          by: ["mode"],
          where,
          _count: { _all: true },
        }),
        prisma.session.aggregate({
          where,
          _avg: { durationSeconds: true },
        }),
        prisma.alert.count({
          where: {
            severity: "critical",
            session: where,
          },
        }),
        prisma.session.groupBy({
          by: ["languageDetected"],
          where,
          _count: { _all: true },
          orderBy: {
            _count: {
              languageDetected: "desc",
            },
          },
        }),
      ]);

    const aiHandled = modeCounts.find((item) => item.mode === "ai_call")?._count._all ?? 0;
    const humanHandled = modeCounts
      .filter((item) => item.mode === "manual_call" || item.mode === "recording")
      .reduce((sum, item) => sum + item._count._all, 0);

    res.json({
      filters: {
        domain: domain ?? "all",
        days,
      },
      totalSessions,
      aiHandled,
      humanHandled,
      avgDurationSeconds: avgDuration._avg.durationSeconds ?? 0,
      criticalAlerts,
      topLanguage: languageGroups[0]?.languageDetected ?? "unknown",
      completionRate:
        totalSessions === 0
          ? 0
          : Number(((completedSessions / totalSessions) * 100).toFixed(2)),
      pendingReviewSessions,
    });
  } catch (error) {
    next(error);
  }
});
