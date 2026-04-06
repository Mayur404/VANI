import { getCallsSchedulingPageData } from "@/lib/services/callscheduling.service";
import { getPatientsList } from "@/lib/services/basic.service";
import ScheduledCallsPageClient from "./ScheduledCallsPageClient";

const ScheduledCallsPage = async () => {
  const [data, patients] = await Promise.all([
    getCallsSchedulingPageData(),
    getPatientsList(),
  ]);

  // Serialize patients to avoid Prisma Decimal issues
  const serializedPatients = patients.map(p => ({
    ...p,
    healthcare_reports: p.healthcare_reports.map(r => ({
      ...r,
    })),
    sessions: p.sessions.map(s => ({
      ...s,
    })),
  }));

  return <ScheduledCallsPageClient data={data} patients={serializedPatients} />;
};

export default ScheduledCallsPage;
