import { getAlertsPageData } from "@/lib/services/alerts.service";
import AlertsCenterPageClient from "./AlertsCenterPageClient";

const toPlainJson = <T,>(value: T): T =>
  JSON.parse(
    JSON.stringify(value, (_, item) => (typeof item === "bigint" ? Number(item) : item)),
  ) as T;

const AlertsCenterPage = async () => {
  const rawAlertsPageData = await getAlertsPageData();
  const alertsPageData = toPlainJson(rawAlertsPageData);

  return <AlertsCenterPageClient data={alertsPageData} />;
};

export default AlertsCenterPage;
