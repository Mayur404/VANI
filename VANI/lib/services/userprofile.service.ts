import { prisma } from "../prisma";
import { getAllUsers, parseJsonArray, toTitleCase } from "./basic.service";

export { getAllUsers };

// ─── HEALTHCARE (Patient) ──────────────────────────────────

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

// ─── FINANCE (Customer) ────────────────────────────────────

export const getCustomerProfile = async (customerId: number) => {
  return prisma.customers.findUnique({
    where: { id: customerId },
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
      finance_reports: {
        orderBy: { created_at: "desc" },
      },
      scheduled_calls: {
        orderBy: { scheduled_time: "desc" },
      },
    },
  });
};

export const getCustomerFinancialSummary = async (customerId: number) => {
  const latestReport = await prisma.finance_reports.findFirst({
    where: { customer_id: customerId },
    orderBy: { created_at: "desc" },
  });

  const customer = await prisma.customers.findUnique({
    where: { id: customerId },
  });

  if (!customer) return null;

  return {
    report: latestReport,
    summaryCards: [
      {
        title: "OUTSTANDING AMOUNT",
        description: customer.outstanding_amount ? `₹${customer.outstanding_amount.toNumber().toLocaleString("en-IN")}` : "N/A",
      },
      {
        title: "LOAN ACCOUNT",
        description: customer.loan_account_number ?? "N/A",
      },
      {
        title: "DUE DATE",
        description: customer.due_date?.toDateString() ?? "Not set",
      },
      {
        title: "PAYMENT STATUS",
        description: latestReport?.payment_status?.toUpperCase() ?? "UNKNOWN",
      },
    ],
    paymentHistory: latestReport ? [
      {
        label: "Last Payment Mode",
        value: latestReport.payment_mode ?? "N/A",
      },
      {
        label: "Amount Paid",
        value: latestReport.amount_paid ? `₹${latestReport.amount_paid.toNumber().toLocaleString("en-IN")}` : "N/A",
      },
      {
        label: "Reason for Non-Payment",
        value: latestReport.reason_for_nonpayment ?? "N/A",
      },
      {
        label: "Promise to Pay",
        value: latestReport.promise_to_pay_date?.toDateString() ?? "N/A",
      },
    ] : [],
    riskIndicators: [
      ...(latestReport?.escalation_required ? [{ flag: "Escalation Required", severity: "High" }] : []),
      ...(latestReport?.next_action === "legal" ? [{ flag: "Legal Action Pending", severity: "High" }] : []),
      ...(latestReport?.next_action === "write_off" ? [{ flag: "Write-Off Recommended", severity: "High" }] : []),
      ...(latestReport?.payment_status === "unpaid" ? [{ flag: "Payment Overdue", severity: "Moderate" }] : []),
      ...(latestReport?.payment_status === "promised" ? [{ flag: "Payment Promised", severity: "Low" }] : []),
    ],
  };
};

export const getCustomerCallTimeline = async (customerId: number) => {
  return prisma.sessions.findMany({
    where: {
      customer_id: customerId,
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

export const getCustomerAlerts = async (customerId: number) => {
  return prisma.alerts.findMany({
    where: {
      sessions: {
        customer_id: customerId,
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

export const getCustomerProfilePageData = async (customerId: number) => {
  const [profile, financialSummary, callTimeline, alerts] = await Promise.all([
    getCustomerProfile(customerId),
    getCustomerFinancialSummary(customerId),
    getCustomerCallTimeline(customerId),
    getCustomerAlerts(customerId),
  ]);

  return {
    profile,
    financialSummary,
    callTimeline,
    alerts,
  };
};
