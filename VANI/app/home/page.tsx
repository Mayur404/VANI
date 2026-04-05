import { getHomePageData } from "@/lib/services/home.service";
import HomePageClient from "./HomePageClient";

const HomePage = async () => {
  const homePageData = await getHomePageData();

  return <HomePageClient data={homePageData} />;
};

export default HomePage;
