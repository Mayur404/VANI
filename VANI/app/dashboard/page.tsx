import { ChartBarInteractive } from "@/components/dashboard/LineGraph";
import { ChartPieLegend } from "@/components/dashboard/PieGraph";
import { PatientConditionChart } from "@/components/dashboard/PatientCondition";
import { SentimentTrendChart } from "@/components/dashboard/SentimentGraph";
import DashboardHero from "@/components/dashboard/DashboardHero";
import {
  getEmptyDashboardOverview,
  getDashboardConditionBreakdown,
  getDashboardLanguageDistribution,
  getDashboardOverview,
  getDashboardSentimentTrend,
  getDashboardSessionsTrend,
} from "@/lib/services/dashboard.service";
import { DEFAULT_DASHBOARD_DAYS, type DashboardDomain } from "@/lib/services/basic.service";
import BasicInfo from "@/components/dashboard/BasicInfo";

type Props = {
    searchParams: Promise<{
        domain?: string;
        days?: string;
        startDate?: string;
        endDate?: string;
    }>;
};

const parseDashboardDomain = (value?: string): DashboardDomain => {
    if (value === "finance" || value === "healthcare") return value;
    return "all";
};

const parseDashboardDate = (value?: string) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const parseDashboardDays = (value?: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DASHBOARD_DAYS;
};

const DashboardPage = async ({ searchParams }: Props) => {
    const params = await searchParams;
    const selectedDomain = parseDashboardDomain(params.domain);
    const parsedStartDate = parseDashboardDate(params.startDate);
    const parsedEndDate = parseDashboardDate(params.endDate);
    const hasCustomRange = Boolean(parsedStartDate && parsedEndDate);
    const selectedDays = hasCustomRange ? null : parseDashboardDays(params.days);
    const filters = {
        domain: selectedDomain,
        ...(hasCustomRange
            ? {
                startDate: parsedStartDate,
                endDate: parsedEndDate,
            }
            : {
                days: selectedDays ?? DEFAULT_DASHBOARD_DAYS,
            }),
    };

    const loadSafely = async <T,>(label: string, loader: () => Promise<T>, fallback: T) => {
        try {
            return await loader();
        } catch (error) {
            console.error(`[dashboard] ${label} query failed`, error);
            return fallback;
        }
    };

    const dashboardOverview = await loadSafely("overview", () => getDashboardOverview(filters), getEmptyDashboardOverview());
    const sessionsTrend = await loadSafely("sessions trend", () => getDashboardSessionsTrend(filters), []);
    const languageDistribution = await loadSafely(
        "language distribution",
        () => getDashboardLanguageDistribution(filters),
        [],
    );
    const conditionBreakdown = await loadSafely(
        "condition breakdown",
        () => getDashboardConditionBreakdown(filters),
        {
            severityBreakdown: { mild: 0, moderate: 0, severe: 0 },
            visitTypeBreakdown: { firstVisit: 0, followUp: 0, emergency: 0 },
            topDiagnoses: [],
        },
    );
    const sentimentTrend = await loadSafely("sentiment trend", () => getDashboardSentimentTrend(filters), []);

    return (
        <div className='min-h-screen bg-[#050505] font-oxanium text-white'>
            <div className='flex w-full flex-col gap-6 px-6 py-6'>
                <div className='w-full'>
                    <DashboardHero
                        selectedDomain={selectedDomain}
                        selectedDays={selectedDays}
                        selectedStartDate={hasCustomRange ? params.startDate : undefined}
                        selectedEndDate={hasCustomRange ? params.endDate : undefined}
                    />
                </div>

                <div className='w-full'>
                    <BasicInfo
                        totalSessions={dashboardOverview.totalSessions}
                        averageDuration={dashboardOverview.averageDurationSeconds}
                        satisfactionScore={dashboardOverview.satisfactionScore}
                        totalPatients={dashboardOverview.totalProfiles}
                        totalSessionsChange={dashboardOverview.totalSessionsChange}
                        averageDurationChange={dashboardOverview.averageDurationChange}
                        domain={selectedDomain}
                    />
                </div>

                <div className='grid w-full grid-cols-1 gap-6 xl:grid-cols-3'>
                    <div className='overflow-hidden rounded-[30px] border border-[#161616] bg-[#090909] p-1 shadow-[0_20px_70px_rgba(0,0,0,0.34)] xl:col-span-2'>
                        <ChartBarInteractive data={sessionsTrend} domain={selectedDomain} />
                    </div>
                    <div className='overflow-hidden rounded-[30px] border border-[#161616] bg-[#090909] p-1 shadow-[0_20px_70px_rgba(0,0,0,0.34)]'>
                        <ChartPieLegend data={languageDistribution} domain={selectedDomain} />
                    </div>
                </div>

                <div className='grid w-full grid-cols-1 gap-6 xl:grid-cols-4'>
                    <div className='overflow-hidden rounded-[30px] border border-[#161616] bg-[#090909] p-1 shadow-[0_20px_70px_rgba(0,0,0,0.34)] xl:col-span-1'>
                        <PatientConditionChart data={conditionBreakdown.severityBreakdown} domain={selectedDomain} />
                    </div>
                    <div className='overflow-hidden rounded-[30px] border border-[#161616] bg-[#090909] p-1 shadow-[0_20px_70px_rgba(0,0,0,0.34)] xl:col-span-3'>
                        <SentimentTrendChart data={sentimentTrend} domain={selectedDomain} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardPage
