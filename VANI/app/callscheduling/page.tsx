import { getCallsSchedulingPageData } from "@/lib/services/callscheduling.service";
import ScheduledCallsPageClient from "./ScheduledCallsPageClient";

const ScheduledCallsPage = async () => {
  const data = await getCallsSchedulingPageData();

  return <ScheduledCallsPageClient data={data} />;
};

export default ScheduledCallsPage;
