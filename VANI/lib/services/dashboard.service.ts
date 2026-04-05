import { prisma } from "../prisma";
import {
  buildDateRange,
  buildSessionWhere,
  DashboardDomain,
  DateRangeInput,
} from "./basic.service";

type DashboardFilters = DateRangeInput & {
  domain?: DashboardDomain;
};

const getPreviousRange = ({ start, end }: { start: Date; end: Date }) => {
  const duration = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);
  return { previousStart, previousEnd };
};

const percentageChange = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

export const getDashboardOverview = async ({
  domain = "all",
  ...range
}: DashboardFilters = {}) => {
  const { start, end } = buildDateRange(range);
  const where = buildSessionWhere(domain, range);
  const { previousStart, previousEnd } = getPreviousRange({ start, end });

  const [
    currentSessions,
    previousSessions,
    currentDuration,
    previousDuration,
    currentSentiment,
    patientCount,
    customerCount,
  ] = await Promise.all([
    prisma.sessions.count({ where }),
    prisma.sessions.count({
      where: {
        ...(domain === "all" ? {} : { domain }),
        created_at: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    }),
    prisma.sessions.aggregate({
      where,
      _avg: { duration_seconds: true },
    }),
    prisma.sessions.aggregate({
      where: {
        ...(domain === "all" ? {} : { domain }),
        created_at: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
      _avg: { duration_seconds: true },
    }),
    prisma.sentiment_analysis.aggregate({
      where: {
        sessions: where,
      },
      _avg: { cooperation_score: true },
    }),
    prisma.patients.count(),
    prisma.customers.count(),
  ]);

  return {
    totalSessions: currentSessions,
    totalSessionsChange: percentageChange(currentSessions, previousSessions),
    averageDurationSeconds: Math.round(currentDuration._avg.duration_seconds ?? 0),
    averageDurationChange: percentageChange(
      currentDuration._avg.duration_seconds ?? 0,
      previousDuration._avg.duration_seconds ?? 0,
    ),
    satisfactionScore: Number(
      (((currentSentiment._avg.cooperation_score ?? 0) / 10) * 5).toFixed(1),
    ),
    totalProfiles:
      domain === "healthcare"
        ? patientCount
        : domain === "finance"
          ? customerCount
          : patientCount + customerCount,
  };
};

export const getDashboardSessionsTrend = async ({
  domain = "all",
  ...range
}: DashboardFilters = {}) => {
  const where = buildSessionWhere(domain, range);
  const sessions = await prisma.sessions.findMany({
    where,
    orderBy: { created_at: "asc" },
    select: {
      created_at: true,
      domain: true,
      mode: true,
      status: true,
      duration_seconds: true,
    },
  });

  const grouped = new Map<
    string,
    {
      date: string;
      totalSessions: number;
      healthcareSessions: number;
      financeSessions: number;
      aiSessions: number;
      manualSessions: number;
      averageDurationSeconds: number;
      durations: number[];
    }
  >();

  for (const session of sessions) {
    const date = session.created_at?.toISOString().slice(0, 10) ?? "unknown";
    const current = grouped.get(date) ?? {
      date,
      totalSessions: 0,
      healthcareSessions: 0,
      financeSessions: 0,
      aiSessions: 0,
      manualSessions: 0,
      averageDurationSeconds: 0,
      durations: [],
    };

    current.totalSessions += 1;
    current.healthcareSessions += session.domain === "healthcare" ? 1 : 0;
    current.financeSessions += session.domain === "finance" ? 1 : 0;
    current.aiSessions += session.mode === "ai_call" ? 1 : 0;
    current.manualSessions += session.mode === "manual_call" || session.mode === "recording" ? 1 : 0;
    if (session.duration_seconds) current.durations.push(session.duration_seconds);

    grouped.set(date, current);
  }

  return [...grouped.values()].map((entry) => ({
    date: entry.date,
    totalSessions: entry.totalSessions,
    healthcareSessions: entry.healthcareSessions,
    financeSessions: entry.financeSessions,
    aiSessions: entry.aiSessions,
    manualSessions: entry.manualSessions,
    averageDurationSeconds:
      entry.durations.length > 0
        ? Math.round(entry.durations.reduce((sum, value) => sum + value, 0) / entry.durations.length)
        : 0,
  }));
};

export const getDashboardLanguageDistribution = async ({
  domain = "all",
  ...range
}: DashboardFilters = {}) => {
  const sessions = await prisma.sessions.findMany({
    where: buildSessionWhere(domain, range),
    select: {
      language_detected: true,
      domain: true,
    },
  });

  const distribution = new Map<
    string,
    { language: string; sessions: number; healthcareSessions: number; financeSessions: number }
  >();

  for (const session of sessions) {
    const language = session.language_detected || "unknown";
    const current = distribution.get(language) ?? {
      language,
      sessions: 0,
      healthcareSessions: 0,
      financeSessions: 0,
    };
    current.sessions += 1;
    current.healthcareSessions += session.domain === "healthcare" ? 1 : 0;
    current.financeSessions += session.domain === "finance" ? 1 : 0;
    distribution.set(language, current);
  }

  return [...distribution.values()].sort((a, b) => b.sessions - a.sessions);
};

export const getDashboardSentimentTrend = async ({
  domain = "all",
  ...range
}: DashboardFilters = {}) => {
  const rows = await prisma.sentiment_analysis.findMany({
    where: {
      sessions: buildSessionWhere(domain, range),
    },
    orderBy: { created_at: "asc" },
    select: {
      overall_sentiment: true,
      stress_level: true,
      cooperation_score: true,
      created_at: true,
    },
  });

  const grouped = new Map<
    string,
    {
      date: string;
      positive: number;
      neutral: number;
      negative: number;
      frustrated: number;
      averageCooperation: number;
      averageStressScore: number;
      cooperationValues: number[];
      stressValues: number[];
    }
  >();

  const stressMap = { low: 1, medium: 2, high: 3 } as const;

  for (const row of rows) {
    const date = row.created_at?.toISOString().slice(0, 10) ?? "unknown";
    const current = grouped.get(date) ?? {
      date,
      positive: 0,
      neutral: 0,
      negative: 0,
      frustrated: 0,
      averageCooperation: 0,
      averageStressScore: 0,
      cooperationValues: [],
      stressValues: [],
    };

    if (row.overall_sentiment) current[row.overall_sentiment] += 1;
    if (typeof row.cooperation_score === "number") current.cooperationValues.push(row.cooperation_score);
    if (row.stress_level) current.stressValues.push(stressMap[row.stress_level]);

    grouped.set(date, current);
  }

  return [...grouped.values()].map((entry) => ({
    date: entry.date,
    positive: entry.positive,
    neutral: entry.neutral,
    negative: entry.negative,
    frustrated: entry.frustrated,
    averageCooperation:
      entry.cooperationValues.length > 0
        ? Number(
            (
              entry.cooperationValues.reduce((sum, value) => sum + value, 0) /
              entry.cooperationValues.length
            ).toFixed(1),
          )
        : 0,
    averageStressScore:
      entry.stressValues.length > 0
        ? Number(
            (
              entry.stressValues.reduce((sum, value) => sum + value, 0) /
              entry.stressValues.length
            ).toFixed(1),
          )
        : 0,
  }));
};

export const getDashboardConditionBreakdown = async ({
  ...range
}: DateRangeInput = {}) => {
  const reports = await prisma.healthcare_reports.findMany({
    where: {
      created_at: buildSessionWhere("healthcare", range).created_at,
    },
    select: {
      severity: true,
      visit_type: true,
      diagnosis: true,
    },
  });

  const summary = {
    mild: 0,
    moderate: 0,
    severe: 0,
    firstVisit: 0,
    followUp: 0,
    emergency: 0,
    topDiagnoses: new Map<string, number>(),
  };

  for (const report of reports) {
    if (report.severity) summary[report.severity] += 1;
    if (report.visit_type === "first_visit") summary.firstVisit += 1;
    if (report.visit_type === "follow_up") summary.followUp += 1;
    if (report.visit_type === "emergency") summary.emergency += 1;
    if (report.diagnosis) {
      summary.topDiagnoses.set(
        report.diagnosis,
        (summary.topDiagnoses.get(report.diagnosis) ?? 0) + 1,
      );
    }
  }

  return {
    severityBreakdown: {
      mild: summary.mild,
      moderate: summary.moderate,
      severe: summary.severe,
    },
    visitTypeBreakdown: {
      firstVisit: summary.firstVisit,
      followUp: summary.followUp,
      emergency: summary.emergency,
    },
    topDiagnoses: [...summary.topDiagnoses.entries()]
      .map(([diagnosis, count]) => ({ diagnosis, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
};

export const getDashboardPaymentDistribution = async ({
  ...range
}: DateRangeInput = {}) => {
  const reports = await prisma.finance_reports.findMany({
    where: {
      created_at: buildSessionWhere("finance", range).created_at,
    },
    select: {
      payment_status: true,
      amount_paid: true,
      next_action: true,
    },
  });

  const summary = {
    paid: 0,
    unpaid: 0,
    partial: 0,
    promised: 0,
    totalCollected: 0,
    followUp: 0,
    legal: 0,
    resolved: 0,
    writeOff: 0,
  };

  for (const report of reports) {
    if (report.payment_status) summary[report.payment_status] += 1;
    summary.totalCollected += Number(report.amount_paid ?? 0);
    if (report.next_action) {
      if (report.next_action === "write_off") summary.writeOff += 1;
      else if (report.next_action === "follow_up") summary.followUp += 1;
      else if (report.next_action === "legal") summary.legal += 1;
      else if (report.next_action === "resolved") summary.resolved += 1;
    }
  }

  return summary;
};

export const getDashboardSnapshots = async ({
  domain = "all",
  ...range
}: DashboardFilters = {}) => {
  const { start, end } = buildDateRange(range);
  return prisma.analytics_snapshots.findMany({
    where: {
      ...(domain === "all" ? {} : { domain }),
      snapshot_date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { snapshot_date: "asc" },
  });
};

export const getDashboardPageData = async (filters: DashboardFilters = {}) => {
  const [overview, sessionsTrend, languageDistribution, sentimentTrend, conditionBreakdown, paymentDistribution, snapshots] =
    await Promise.all([
      getDashboardOverview(filters),
      getDashboardSessionsTrend(filters),
      getDashboardLanguageDistribution(filters),
      getDashboardSentimentTrend(filters),
      getDashboardConditionBreakdown(filters),
      getDashboardPaymentDistribution(filters),
      getDashboardSnapshots(filters),
    ]);

  return {
    overview,
    sessionsTrend,
    languageDistribution,
    sentimentTrend,
    conditionBreakdown,
    paymentDistribution,
    snapshots,
  };
};
