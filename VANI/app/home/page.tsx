import { getHomePageData } from "@/lib/services/home.service";
import HomePageClient from "./HomePageClient";

const fallbackHomePageData = {
  summary: {
    healthcareSessions: 0,
    financeSessions: 0,
    activeAlerts: 0,
    activePrograms: 0,
    pendingCalls: 0,
  },
  recentActivity: [],
  workspaceOptions: {
    healthcare: {
      supportedLanguages: [],
    },
    finance: {
      supportedLanguages: [],
    },
  },
};

const HomePage = async () => {
  let homePageData = fallbackHomePageData;

  try {
    homePageData = await getHomePageData();
  } catch (error) {
    console.error("[Home] Failed to load homepage data, rendering fallback.", error);
  }

  return <HomePageClient data={homePageData} />;
};

export default HomePage;
