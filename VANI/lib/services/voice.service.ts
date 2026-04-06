import { prisma } from "../prisma";
import { parseJsonArray, toTitleCase } from "./basic.service";

const toPlainJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const getRecentVoiceSessions = async ({
  domain,
  limit = 10,
}: {
  domain?: "healthcare" | "finance";
  limit?: number;
} = {}) => {
  return prisma.sessions.findMany({
    where: domain ? { domain } : undefined,
    take: limit,
    orderBy: { created_at: "desc" },
    include: {
      users: true,
      patients: true,
      customers: true,
      sentiment_analysis: true,
    },
  });
};

export const getTranscriptBySessionId = async (sessionId: number) => {
  return prisma.transcripts.findMany({
    where: { session_id: sessionId },
    orderBy: { timestamp_seconds: "asc" },
  });
};

export const getSessionExtraction = async (sessionId: number) => {
  const session = await prisma.sessions.findUnique({
    where: { id: sessionId },
    include: {
      sentiment_analysis: true,
      healthcare_reports: {
        orderBy: { created_at: "desc" },
        take: 1,
      },
      finance_reports: {
        orderBy: { created_at: "desc" },
        take: 1,
      },
    },
  });

  if (!session) return null;

  const healthcareReport = session.healthcare_reports[0];
  const financeReport = session.finance_reports[0];

  if (session.domain === "healthcare" && healthcareReport) {
    return {
      domain: session.domain,
      summary: healthcareReport.diagnosis,
      chiefComplaint: healthcareReport.chief_complaint,
      symptoms: parseJsonArray(healthcareReport.symptoms),
      medications: parseJsonArray(healthcareReport.current_medications),
      allergies: parseJsonArray(healthcareReport.allergies),
      riskIndicators: parseJsonArray(healthcareReport.risk_indicators).map(toTitleCase),
      sentiment: session.sentiment_analysis?.overall_sentiment ?? null,
      recommendation: session.sentiment_analysis?.ai_recommendation ?? null,
    };
  }

  if (session.domain === "finance" && financeReport) {
    return {
      domain: session.domain,
      summary: financeReport.executive_notes,
      paymentStatus: financeReport.payment_status,
      amountPaid: Number(financeReport.amount_paid ?? 0),
      promiseToPayDate: financeReport.promise_to_pay_date,
      nextAction: financeReport.next_action,
      reasonForNonPayment: financeReport.reason_for_nonpayment,
      sentiment: session.sentiment_analysis?.overall_sentiment ?? null,
      recommendation: session.sentiment_analysis?.ai_recommendation ?? null,
    };
  }

  return {
    domain: session.domain,
    sentiment: session.sentiment_analysis?.overall_sentiment ?? null,
    recommendation: session.sentiment_analysis?.ai_recommendation ?? null,
  };
};

export const getVoiceSessionById = async (sessionId: number) => {
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
      healthcare_reports: {
        orderBy: { created_at: "desc" },
      },
      finance_reports: {
        orderBy: { created_at: "desc" },
      },
      alerts: {
        orderBy: { created_at: "desc" },
      },
    },
  });
};

export const getVoicePageData = async (sessionId: number) => {
  const [session, transcript, extraction] = await Promise.all([
    getVoiceSessionById(sessionId),
    getTranscriptBySessionId(sessionId),
    getSessionExtraction(sessionId),
  ]);

  return {
    session: session ? toPlainJson(session) : null,
    transcript: toPlainJson(transcript),
    extraction: extraction ? toPlainJson(extraction) : null,
  };
};
