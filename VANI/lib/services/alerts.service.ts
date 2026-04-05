import { prisma } from "../prisma";

type AlertFilters = {
  domain?: "healthcare" | "finance";
  severity?: "low" | "medium" | "critical";
  acknowledged?: boolean;
  limit?: number;
};

const buildAlertTags = ({
  domain,
  alertType,
  sentToDoctor,
  sentToPatient,
  sentToEmergency,
}: {
  domain: "healthcare" | "finance";
  alertType: "critical_symptom" | "payment_risk" | "escalation" | null;
  sentToDoctor: boolean;
  sentToPatient: boolean;
  sentToEmergency: boolean;
}) => {
  const tags = new Set<string>();

  if (domain === "healthcare") {
    if (sentToEmergency) tags.add("EMERGENCY");
    if (sentToDoctor) tags.add("DOCTOR");
    if (sentToPatient) tags.add("PATIENT");
    if (alertType === "critical_symptom") tags.add("PHARMACY");
  }

  if (domain === "finance") {
    tags.add("FINANCE");
    if (alertType === "escalation") tags.add("SYSTEM");
  }

  if (tags.size === 0) tags.add("SYSTEM");
  return [...tags];
};

export const getAlerts = async ({
  domain,
  severity,
  acknowledged,
  limit = 50,
}: AlertFilters = {}) => {
  const alerts = await prisma.alerts.findMany({
    where: {
      ...(severity ? { severity } : {}),
      ...(typeof acknowledged === "boolean"
        ? acknowledged
          ? { acknowledged_at: { not: null } }
          : { acknowledged_at: null }
        : {}),
      ...(domain
        ? {
            sessions: {
              domain,
            },
          }
        : {}),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit,
    include: {
      sessions: {
        include: {
          users: true,
          patients: true,
          customers: true,
          sentiment_analysis: true,
        },
      },
    },
  });

  return alerts.map((alert) => ({
    ...alert,
    tags: buildAlertTags({
      domain: alert.sessions.domain,
      alertType: alert.alert_type ?? null,
      sentToDoctor: alert.sent_to_doctor,
      sentToPatient: Boolean(alert.sent_to_patient),
      sentToEmergency: Boolean(alert.sent_to_emergency),
    }),
    subjectName: alert.sessions.patients?.name ?? alert.sessions.customers?.name ?? null,
    ownerName: alert.sessions.users?.name ?? null,
  }));
};

export const getAlertCounts = async () => {
  const [critical, medium, low, acknowledged] = await Promise.all([
    prisma.alerts.count({
      where: { severity: "critical", acknowledged_at: null },
    }),
    prisma.alerts.count({
      where: { severity: "medium", acknowledged_at: null },
    }),
    prisma.alerts.count({
      where: { severity: "low", acknowledged_at: null },
    }),
    prisma.alerts.count({
      where: { acknowledged_at: { not: null } },
    }),
  ]);

  return {
    critical,
    medium,
    low,
    acknowledged,
    totalOpen: critical + medium + low,
  };
};

export const getAlertTrend = async (days = 7) => {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const alerts = await prisma.alerts.findMany({
    where: {
      created_at: {
        gte: start,
      },
    },
    select: {
      created_at: true,
      severity: true,
      acknowledged_at: true,
    },
    orderBy: { created_at: "asc" },
  });

  const trend = new Map<
    string,
    {
      date: string;
      total: number;
      critical: number;
      medium: number;
      low: number;
      acknowledged: number;
    }
  >();

  for (const alert of alerts) {
    const date = alert.created_at?.toISOString().slice(0, 10) ?? "unknown";
    const current = trend.get(date) ?? {
      date,
      total: 0,
      critical: 0,
      medium: 0,
      low: 0,
      acknowledged: 0,
    };
    current.total += 1;
    if (alert.severity) current[alert.severity] += 1;
    if (alert.acknowledged_at) current.acknowledged += 1;
    trend.set(date, current);
  }

  return [...trend.values()];
};

export const getLatestCriticalAlert = async () => {
  return prisma.alerts.findFirst({
    where: { severity: "critical" },
    orderBy: { created_at: "desc" },
    include: {
      sessions: {
        include: {
          users: true,
          patients: true,
          customers: true,
          transcripts: {
            orderBy: { timestamp_seconds: "asc" },
            take: 5,
          },
        },
      },
    },
  });
};

export const getAlertsPageData = async (filters: AlertFilters = {}) => {
  const [counts, alerts, trend, latestCritical] = await Promise.all([
    getAlertCounts(),
    getAlerts(filters),
    getAlertTrend(),
    getLatestCriticalAlert(),
  ]);

  return {
    counts,
    alerts,
    trend,
    latestCritical,
  };
};
