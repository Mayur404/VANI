import { prisma } from "../prisma";

const startOfWeek = (value = new Date()) => {
  const date = new Date(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfWeek = (value = new Date()) => {
  const date = startOfWeek(value);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
};

export const getWeeklyScheduledCallSummary = async (referenceDate = new Date()) => {
  const weekStart = startOfWeek(referenceDate);
  const weekEnd = endOfWeek(referenceDate);

  const calls = await prisma.scheduled_calls.findMany({
    where: {
      scheduled_time: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    select: {
      scheduled_time: true,
      status: true,
    },
    orderBy: { scheduled_time: "asc" },
  });

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const summary = days.map((day, index) => ({
    day,
    date: new Date(weekStart.getTime() + index * 24 * 60 * 60 * 1000),
    totalCalls: 0,
    pendingCalls: 0,
    initiatedCalls: 0,
    completedCalls: 0,
    failedCalls: 0,
  }));

  for (const call of calls) {
    const date = call.scheduled_time;
    const jsDay = date.getDay();
    const index = jsDay === 0 ? 6 : jsDay - 1;
    const slot = summary[index];
    if (!slot) continue;

    slot.totalCalls += 1;
    if (call.status === "pending") slot.pendingCalls += 1;
    if (call.status === "initiated") slot.initiatedCalls += 1;
    if (call.status === "completed") slot.completedCalls += 1;
    if (call.status === "failed") slot.failedCalls += 1;
  }

  return summary;
};

export const getUpcomingScheduledCalls = async (limit = 20) => {
  return prisma.scheduled_calls.findMany({
    where: {
      scheduled_time: {
        gte: new Date(),
      },
    },
    orderBy: { scheduled_time: "asc" },
    take: limit,
    include: {
      customers: true,
      sessions: {
        include: {
          users: true,
          finance_reports: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
          sentiment_analysis: true,
          alerts: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
      },
    },
  });
};

export const getPastScheduledCalls = async (limit = 20) => {
  return prisma.scheduled_calls.findMany({
    where: {
      OR: [
        { status: "completed" },
        { status: "failed" },
        {
          scheduled_time: {
            lt: new Date(),
          },
        },
      ],
    },
    orderBy: { scheduled_time: "desc" },
    take: limit,
    include: {
      customers: true,
      sessions: {
        include: {
          users: true,
          finance_reports: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
          alerts: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
      },
    },
  });
};

export const getScheduledCallById = async (scheduledCallId: number) => {
  return prisma.scheduled_calls.findUnique({
    where: { id: scheduledCallId },
    include: {
      customers: true,
      sessions: {
        include: {
          users: true,
          transcripts: {
            orderBy: { timestamp_seconds: "asc" },
          },
          sentiment_analysis: true,
          finance_reports: {
            orderBy: { created_at: "desc" },
          },
          alerts: {
            orderBy: { created_at: "desc" },
          },
        },
      },
    },
  });
};

export const getCallsSchedulingPageData = async (referenceDate = new Date()) => {
  const [weekSummary, upcomingCalls, pastCalls] = await Promise.all([
    getWeeklyScheduledCallSummary(referenceDate),
    getUpcomingScheduledCalls(),
    getPastScheduledCalls(),
  ]);

  return {
    weekSummary,
    upcomingCalls,
    pastCalls,
  };
};
