import { Router } from "express";
import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "../lib/prisma";
import { parseDateRangeFilters, toNumber } from "../lib/http";

export const analyticsRouter = Router();

analyticsRouter.get("/overview", async (req, res, next) => {
  try {
    const { domain, days, where } = parseDateRangeFilters(req);
    const domainSql =
      domain === "healthcare"
        ? Prisma.sql`AND domain = 'healthcare'`
        : domain === "finance"
          ? Prisma.sql`AND domain = 'finance'`
          : Prisma.empty;

    const [dailySessionsRaw, financeBreakdown, sentimentBreakdown, alertBreakdown, languageBreakdown] =
      await Promise.all([
        prisma.$queryRaw<
          Array<{
            day: Date;
            totalSessions: bigint;
            avgDurationSeconds: number | null;
            healthcareSessions: bigint;
            financeSessions: bigint;
          }>
        >`
          SELECT
            DATE(created_at) AS day,
            COUNT(*) AS totalSessions,
            ROUND(AVG(duration_seconds), 2) AS avgDurationSeconds,
            SUM(CASE WHEN domain = 'healthcare' THEN 1 ELSE 0 END) AS healthcareSessions,
            SUM(CASE WHEN domain = 'finance' THEN 1 ELSE 0 END) AS financeSessions
          FROM sessions
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
          ${domainSql}
          GROUP BY DATE(created_at)
          ORDER BY day DESC
          LIMIT ${days}
        `,
        prisma.financeReport.groupBy({
          by: ["paymentStatus"],
          where: {
            session: where,
          },
          _count: { paymentStatus: true },
          _sum: { amountPaid: true },
        }),
        prisma.sentimentAnalysis.groupBy({
          by: ["overallSentiment"],
          where: {
            session: where,
          },
          _count: { _all: true },
        }),
        prisma.alert.groupBy({
          by: ["severity", "alertType"],
          where: {
            session: where,
          },
          _count: { _all: true },
        }),
        prisma.session.groupBy({
          by: ["languageDetected"],
          where,
          _count: { languageDetected: true },
          orderBy: {
            _count: {
              languageDetected: "desc",
            },
          },
        }),
      ]);

    const dailySessions = dailySessionsRaw.map((item) => ({
      day: item.day,
      totalSessions: Number(item.totalSessions),
      avgDurationSeconds: item.avgDurationSeconds,
      healthcareSessions: Number(item.healthcareSessions),
      financeSessions: Number(item.financeSessions),
    }));

    res.json({
      filters: {
        domain: domain ?? "all",
        days,
      },
      dailySessions,
      financeBreakdown: financeBreakdown.map((item) => ({
        paymentStatus: item.paymentStatus ?? "unknown",
        count: item._count.paymentStatus,
        totalAmountPaid: toNumber(item._sum.amountPaid),
      })),
      sentimentBreakdown,
      alertBreakdown,
      languageBreakdown: languageBreakdown.map((item) => ({
        language: item.languageDetected ?? "unknown",
        count: item._count.languageDetected,
      })),
    });
  } catch (error) {
    next(error);
  }
});
