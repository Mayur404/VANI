import { ChartBarInteractive } from "@/components/dashboard/LineGraph";
import { ChartPieLegend } from "@/components/dashboard/PieGraph";
import { PatientConditionChart } from "@/components/dashboard/PatientCondition";
import { SentimentTrendChart } from "@/components/dashboard/SentimentGraph";
import DashboardHero from "@/components/dashboard/DashboardHero";
import {
  getDashboardConditionBreakdown,
  getDashboardLanguageDistribution,
  getDashboardOverview,
  getDashboardSentimentTrend,
  getDashboardSessionsTrend,
} from "@/lib/services/dashboard.service";
import BasicInfo from "@/components/dashboard/BasicInfo";

const DashboardPage = async () => {
    const [
        dashboardOverview,
        sessionsTrend,
        languageDistribution,
        conditionBreakdown,
        sentimentTrend,
    ] = await Promise.all([
        getDashboardOverview(),
        getDashboardSessionsTrend(),
        getDashboardLanguageDistribution(),
        getDashboardConditionBreakdown(),
        getDashboardSentimentTrend(),
    ]);

    return (
        <div className='font-oxanium bg-black'>
            <div className='w-full h-[120vh] flex flex-col'>
                {/* Hero Section */}
                <div className='w-full h-2/24 flex items-center justify-center gap-4 py-4 px-2'>
                    <DashboardHero />
                </div>
                {/* Basic Info */}
                <div className='w-full h-4/24 flex items-center justify-center gap-8 p-4'>
                    <BasicInfo totalSessions={dashboardOverview.totalSessions}
                        averageDuration={dashboardOverview.averageDurationSeconds}
                        satisfactionScore={dashboardOverview.satisfactionScore}
                        totalPatients={dashboardOverview.totalProfiles}
                        totalSessionsChange={dashboardOverview.totalSessionsChange}
                        averageDurationChange={dashboardOverview.averageDurationChange} />
                </div>
                {/* Sessions Per Day and Language Disctribution */}
                <div className=' z-0 w-full h-9/24 flex items-center justify-center gap-4 p-4'>
                    <div className=' z-10 h-full w-2/3 bg-[#0f0e10] rounded-2xl shadow-[5px_5px_10px_6px_rgba(0,0,0,0.35)]'>
                        <ChartBarInteractive data={sessionsTrend} />
                    </div>
                    <div className='h-full w-1/3 bg-[#0f0e10] rounded-2xl shadow-[5px_5px_10px_6px_rgba(0,0,0,0.35)]'>
                        <ChartPieLegend data={languageDistribution} />
                    </div>
                </div>
                {/* Sentiment Trend and Payment Distribution */}
                <div className='w-full h-9/24 flex items-center justify-center gap-4 p-4'>
                    <div className='h-full w-1/4 bg-[#0f0e10] rounded-2xl shadow-[5px_5px_10px_6px_rgba(0,0,0,0.35)]'>
                        <PatientConditionChart data={conditionBreakdown.severityBreakdown} />
                    </div>
                    <div className='h-full w-3/4 bg-[#0f0e10] rounded-2xl shadow-[5px_5px_10px_6px_rgba(0,0,0,0.35)]'>
                        <SentimentTrendChart data={sentimentTrend} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardPage
