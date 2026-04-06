import { getCallsSchedulingPageData } from "@/lib/services/callscheduling.service";
import { getPatientsList } from "@/lib/services/basic.service";
import ScheduledCallsPageClient from "./ScheduledCallsPageClient";

const ScheduledCallsPage = async () => {
  const [rawData, patients] = await Promise.all([
    getCallsSchedulingPageData(),
    getPatientsList(),
  ]);

  // Serialize to strip Prisma Decimal objects from scheduled calls (finance)
  const data = {
    ...rawData,
    upcomingCalls: rawData.upcomingCalls.map(c => ({
      ...c,
      customers: c.customers ? {
        ...c.customers,
        outstanding_amount: c.customers.outstanding_amount?.toNumber() ?? null,
      } : null,
      sessions: c.sessions ? {
        ...c.sessions,
        finance_reports: c.sessions.finance_reports.map(r => ({
          ...r,
          amount_paid: r.amount_paid?.toNumber() ?? null,
        })),
      } : null,
    })),
    pastCalls: rawData.pastCalls.map(c => ({
      ...c,
      customers: c.customers ? {
        ...c.customers,
        outstanding_amount: c.customers.outstanding_amount?.toNumber() ?? null,
      } : null,
      sessions: c.sessions ? {
        ...c.sessions,
        finance_reports: c.sessions.finance_reports.map(r => ({
          ...r,
          amount_paid: r.amount_paid?.toNumber() ?? null,
        })),
      } : null,
    })),
  };

  // Serialize patients (healthcare) - no Decimals but spread for safety
  const serializedPatients = patients.map(p => ({
    ...p,
    healthcare_reports: p.healthcare_reports.map(r => ({ ...r })),
    sessions: p.sessions.map(s => ({ ...s, users: s.users ? { ...s.users } : null })),
  }));

  return <ScheduledCallsPageClient data={data} patients={serializedPatients} />;
};

export default ScheduledCallsPage;
