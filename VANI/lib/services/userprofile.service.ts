import { prisma } from "../prisma";
import { getAllUsers, parseJsonArray, toTitleCase } from "./basic.service";

export { getAllUsers };

export const getPatientProfile = async (patientId: number) => {
  return prisma.patients.findUnique({
    where: { id: patientId },
    include: {
      sessions: {
        orderBy: { created_at: "desc" },
        include: {
          users: true,
          alerts: {
            orderBy: { created_at: "desc" },
          },
        },
      },
      healthcare_reports: {
        orderBy: { created_at: "desc" },
      },
      monitoring_programs: {
        orderBy: { created_at: "desc" },
        include: {
          users: true,
          sessions: true,
        },
      },
    },
  });
};

export const getPatientMedicalSummary = async (patientId: number) => {
  const latestReport = await prisma.healthcare_reports.findFirst({
    where: { patient_id: patientId },
    orderBy: { created_at: "desc" },
  });

  if (!latestReport) return null;

  return {
    report: latestReport,
    summaryCards: [
      {
        title: "CHIEF COMPLAINT",
        description: latestReport.chief_complaint,
      },
      {
        title: "PRIMARY DIAGNOSIS",
        description: latestReport.diagnosis,
      },
      {
        title: "TREATMENT PLAN",
        description: latestReport.treatment_plan,
      },
      {
        title: "FOLLOW-UP",
        description: latestReport.follow_up_date?.toDateString(),
      },
    ],
    activeMedications: parseJsonArray(latestReport.current_medications).map((item) => ({
      name: item,
    })),
    riskIndicators: parseJsonArray(latestReport.risk_indicators).map((item) => ({
      flag: toTitleCase(item),
      severity:
        latestReport.severity === "severe"
          ? "High"
          : latestReport.severity === "moderate"
            ? "Moderate"
            : "Low",
    })),
  };
};

export const getPatientVisitTimeline = async (patientId: number) => {
  return prisma.sessions.findMany({
    where: {
      patient_id: patientId,
    },
    orderBy: { created_at: "asc" },
    select: {
      id: true,
      created_at: true,
      completed_at: true,
      status: true,
      mode: true,
      language_detected: true,
    },
  });
};

export const getPatientAlerts = async (patientId: number) => {
  return prisma.alerts.findMany({
    where: {
      sessions: {
        patient_id: patientId,
      },
    },
    orderBy: { created_at: "desc" },
    include: {
      sessions: {
        include: {
          users: true,
        },
      },
    },
  });
};

export const getPatientReferrals = async (patientId: number) => {
  const reports = await prisma.healthcare_reports.findMany({
    where: {
      patient_id: patientId,
      referred_to: {
        not: null,
      },
    },
    orderBy: { created_at: "desc" },
    include: {
      sessions: {
        include: {
          users: true,
        },
      },
    },
  });

  return reports.map((report) => ({
    id: report.id,
    referral: report.referred_to,
    reason: report.treatment_plan,
    status: report.follow_up_date && report.follow_up_date >= new Date() ? "Scheduled" : "Review",
    doctorName: report.sessions.users?.name ?? null,
    createdAt: report.created_at,
  }));
};

export const getPatientActivePrograms = async (patientId: number) => {
  return prisma.monitoring_programs.findMany({
    where: { patient_id: patientId },
    orderBy: { created_at: "desc" },
    include: {
      users: true,
      sessions: true,
    },
  });
};

export const getUserProfilePageData = async (patientId: number) => {
  const [profile, medicalSummary, visits, alerts, referrals, activePrograms] = await Promise.all([
    getPatientProfile(patientId),
    getPatientMedicalSummary(patientId),
    getPatientVisitTimeline(patientId),
    getPatientAlerts(patientId),
    getPatientReferrals(patientId),
    getPatientActivePrograms(patientId),
  ]);

  return {
    profile,
    medicalSummary,
    visits,
    alerts,
    referrals,
    activePrograms,
  };
};
