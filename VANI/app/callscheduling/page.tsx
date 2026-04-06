import { getCallsSchedulingPageData } from "@/lib/services/callscheduling.service";
import ScheduledCallsPageClient from "./ScheduledCallsPageClient";

const ScheduledCallsPage = async () => {
  const rawData = await getCallsSchedulingPageData();

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

  return <ScheduledCallsPageClient data={data} />;
};

export default ScheduledCallsPage;
