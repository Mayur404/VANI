import { prisma } from "../prisma";

export const getHomeWorkspaceSummary = async () => {
  const [healthcareSessions, financeSessions, activeAlerts, activePrograms, pendingCalls] =
    await Promise.all([
      prisma.sessions.count({ where: { domain: "healthcare" } }),
      prisma.sessions.count({ where: { domain: "finance" } }),
      prisma.alerts.count({ where: { acknowledged_at: null } }),
      prisma.monitoring_programs.count({ where: { status: "active" } }),
      prisma.scheduled_calls.count({ where: { status: "pending" } }),
    ]);

  return {
    healthcareSessions,
    financeSessions,
    activeAlerts,
    activePrograms,
    pendingCalls,
  };
};

export const getHomeRecentActivity = async (limit = 8) => {
  return prisma.sessions.findMany({
    take: limit,
    orderBy: { created_at: "desc" },
    include: {
      users: true,
      patients: true,
      customers: true,
      alerts: {
        orderBy: { created_at: "desc" },
        take: 1,
      },
      scheduled_calls: {
        orderBy: { scheduled_time: "asc" },
        take: 1,
      },
    },
  });
};

export const getWorkspaceOptions = async () => {
  const [topHealthcareLanguages, topFinanceLanguages] = await Promise.all([
    prisma.sessions.findMany({
      where: { domain: "healthcare" },
      select: { language_detected: true },
    }),
    prisma.sessions.findMany({
      where: { domain: "finance" },
      select: { language_detected: true },
    }),
  ]);

  return {
    healthcare: {
      supportedLanguages: [...new Set(topHealthcareLanguages.map((item) => item.language_detected).filter(Boolean))],
    },
    finance: {
      supportedLanguages: [...new Set(topFinanceLanguages.map((item) => item.language_detected).filter(Boolean))],
    },
  };
};

export const getHomePageData = async () => {
  const [summary, recentActivity, workspaceOptions] = await Promise.all([
    getHomeWorkspaceSummary(),
    getHomeRecentActivity(),
    getWorkspaceOptions(),
  ]);

  return {
    summary,
    recentActivity,
    workspaceOptions,
  };
};
