import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import SessionsPageClient from "./SessionsPageClient";
import { PatientCard } from "@/components/sessions/PatientCard";
import { CustomerCard } from "@/components/sessions/CustomerCard";
import {
  getPatients,
  getCustomers,
  getPatientsCount,
  getCustomersCount,
  getActiveSessionsCount,
  getPendingReportsCount,
  getCallsTodayCount,
  getPendingFollowUpsCount,
  getMockPatients,
  getMockCustomers,
} from "@/lib/services/sessions.service";

export default async function SessionsPage() {
  // Get stored domain from cookie (set by home page selection)
  const cookieStore = await cookies();
  const selectedDomain = cookieStore.get("selected_domain")?.value as "healthcare" | "finance" | null;

  // Redirect if no domain selected
  if (!selectedDomain) {
    redirect("/");
  }

  // Fetch data based on domain
  let patients: any[] = [];
  let customers: any[] = [];
  let stats = { total: 0, activeSessions: 0, pendingReports: 0 };

  try {
    if (selectedDomain === "healthcare") {
      const [patientsData, total, activeSessions, pendingReports] = await Promise.all([
        getPatients().catch(() => getMockPatients()),
        getPatientsCount().catch(() => 3),
        getActiveSessionsCount("healthcare").catch(() => 0),
        getPendingReportsCount().catch(() => 0),
      ]);
      patients = patientsData;
      stats = { total, activeSessions, pendingReports };
    } else if (selectedDomain === "finance") {
      const [customersData, total, callsToday, pendingFollowUps] = await Promise.all([
        getCustomers().catch(() => getMockCustomers()),
        getCustomersCount().catch(() => 3),
        getCallsTodayCount().catch(() => 0),
        getPendingFollowUpsCount().catch(() => 0),
      ]);
      customers = customersData;
      stats = { total, activeSessions: callsToday, pendingReports: pendingFollowUps };
    }
  } catch (error) {
    console.error("Failed to fetch sessions data:", error);
    // Use mock data on error
    patients = selectedDomain === "healthcare" ? getMockPatients() : [];
    customers = selectedDomain === "finance" ? getMockCustomers() : [];
    stats = { total: 3, activeSessions: 0, pendingReports: 0 };
  }

  return (
    <SessionsPageClient
      domain={selectedDomain}
      initialPatients={patients}
      initialCustomers={customers}
      stats={stats}
    />
  );
}
