import { getRecentVoiceSessions, getVoicePageData } from "@/lib/services/voice.service";
import VoiceRecordingPageClient from "./VoiceRecordingPageClient";

const VoiceRecordingPage = async () => {
  const recentSessions = await getRecentVoiceSessions({ limit: 1 });
  const activeSessionId = recentSessions[0]?.id;
  const pageData = activeSessionId ? await getVoicePageData(activeSessionId) : null;

  return <VoiceRecordingPageClient pageData={pageData} />;
};

export default VoiceRecordingPage;
