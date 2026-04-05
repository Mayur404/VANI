import { getAlertsPageData } from "@/lib/services/alerts.service";
import AlertsCenterPageClient from "./AlertsCenterPageClient";

const AlertsCenterPage = async () => {
  const alertsPageData = await getAlertsPageData();

  return <AlertsCenterPageClient data={alertsPageData} />;
};

export default AlertsCenterPage;
