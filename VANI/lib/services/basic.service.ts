import { prisma } from "../prisma";

export type DashboardDomain = "all" | "healthcare" | "finance";

export type DateRangeInput = {
  startDate?: Date;
  endDate?: Date;
  days?: number;
};

export const DEFAULT_DASHBOARD_DAYS = 7;

export const parseJsonArray = (value?: string | null): string[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

export const toTitleCase = (value: string) =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

export const buildDateRange = ({
  startDate,
  endDate,
  days = DEFAULT_DASHBOARD_DAYS,
}: DateRangeInput = {}) => {
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);

  return { start, end };
};

export const buildSessionWhere = (
  domain: DashboardDomain = "all",
  range?: DateRangeInput,
) => {
  const { start, end } = buildDateRange(range);

  return {
    ...(domain === "all" ? {} : { domain }),
    created_at: {
      gte: start,
      lte: end,
    },
  };
};

export const getAllUsers = async () => {
  return prisma.users.findMany({
    orderBy: { created_at: "asc" },
  });
};

export const getUsersByRole = async (role?: "doctor" | "bank_agent" | "admin") => {
  return prisma.users.findMany({
    where: role ? { role } : undefined,
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
};

export const getPatientsList = async () => {
  return prisma.patients.findMany({
    orderBy: { name: "asc" },
    include: {
      healthcare_reports: {
        orderBy: { created_at: "desc" },
        take: 1,
      },
      sessions: {
        orderBy: { created_at: "desc" },
        take: 1,
      },
    },
  });
};

export const getCustomersList = async () => {
  return prisma.customers.findMany({
    orderBy: { due_date: "asc" },
    include: {
      finance_reports: {
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

export const getSessionById = async (sessionId: number) => {
  return prisma.sessions.findUnique({
    where: { id: sessionId },
    include: {
      users: true,
      patients: true,
      customers: true,
      transcripts: {
        orderBy: { timestamp_seconds: "asc" },
      },
      sentiment_analysis: true,
      healthcare_reports: true,
      finance_reports: true,
      alerts: {
        orderBy: { created_at: "desc" },
      },
      monitoring_programs: true,
      scheduled_calls: true,
    },
  });
};

export const searchPatients = async (query: string) => {
  return prisma.patients.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { phone_number: { contains: query } },
        { insurance_id: { contains: query } },
      ],
    },
    orderBy: { name: "asc" },
    take: 20,
  });
};

export const searchCustomers = async (query: string) => {
  return prisma.customers.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { phone_number: { contains: query } },
        { loan_account_number: { contains: query } },
      ],
    },
    orderBy: { due_date: "asc" },
    take: 20,
  });
};

export const getRecentSessions = async (limit = 10) => {
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
    },
  });
};
