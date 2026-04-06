'use client'
import { DatePickerWithRange } from "@/components/dashboard/DatePicker"
import { SelectDemo } from "@/components/dashboard/DomainFilder";
import type { DashboardDomain } from "@/lib/services/basic.service";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type DashboardHeroProps = {
    selectedDomain: DashboardDomain;
    selectedDays: number | null;
    selectedStartDate?: string;
    selectedEndDate?: string;
};

const DashboardHero = ({
    selectedDomain,
    selectedDays,
    selectedStartDate,
    selectedEndDate,
}: DashboardHeroProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isFinance = selectedDomain === "finance";
    const accentClasses = isFinance
        ? {
            glow: "rgba(245,158,11,0.12)",
            button: "bg-[#f5f5f5] text-black shadow-[0_10px_22px_rgba(245,158,11,0.18)]",
            hover: "hover:bg-[#1a1408]",
            panel: "border-[#3d2a08] bg-[#0d0d0d]",
        }
        : {
            glow: "rgba(16,185,129,0.12)",
            button: "bg-[#f5f5f5] text-black shadow-[0_10px_22px_rgba(16,185,129,0.18)]",
            hover: "hover:bg-[#0f1814]",
            panel: "border-[#173126] bg-[#0d0d0d]",
        };

    const updateSearch = (mutate: (params: URLSearchParams) => void) => {
        const params = new URLSearchParams(searchParams.toString());
        mutate(params);
        const next = params.toString();
        router.replace(next ? `${pathname}?${next}` : pathname);
    };

    const handlePresetRange = (days: number) => {
        updateSearch((params) => {
            params.set("days", String(days));
            params.delete("startDate");
            params.delete("endDate");
        });
    };

    return (
        <div
            className="w-full rounded-[30px] border border-[#171717] px-6 py-6 shadow-[0_20px_70px_rgba(0,0,0,0.34)]"
            style={{
                background: `radial-gradient(circle at top left, ${accentClasses.glow}, transparent 28%), radial-gradient(circle at top right, rgba(59,130,246,0.1), transparent 26%), #090909`,
            }}
        >
            <div className="flex w-full flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className='flex w-full flex-col justify-center xl:w-1/3'>
                    <p className='text-xs uppercase tracking-[0.45em] text-[#7c7c7c]'>Insights</p>
                    <h1 className='mt-3 text-4xl font-semibold text-white' style={{ fontFamily: "Outfit" }}>ANALYTICS DASHBOARD</h1>
                    <p className='mt-3 max-w-xl text-sm leading-6 text-[#aaaaaa]'>
                        Track activity, language patterns, session quality, and patient sentiment without leaving the existing dashboard flow.
                    </p>
                </div>

                <div className='flex w-full items-center justify-center xl:w-1/3'>
                    <div className={`grid w-full max-w-xl grid-cols-3 rounded-[24px] border p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${accentClasses.panel}`}>
                        {[7, 30, 90].map((option) => (
                            <button
                                key={option}
                                type="button"
                                className={`rounded-[18px] px-3 py-3 text-sm font-medium transition-all duration-200 ${
                                    selectedDays === option
                                        ? accentClasses.button
                                        : `text-white ${accentClasses.hover}`
                                }`}
                                onClick={() => handlePresetRange(option)}
                            >
                                {option} DAYS
                            </button>
                        ))}
                    </div>
                </div>

                <div className='grid w-full grid-cols-1 gap-4 xl:w-1/3 xl:grid-cols-2'>
                    <div className={`flex min-h-[58px] items-center justify-center rounded-[22px] border px-3 py-2 ${accentClasses.panel}`}>
                        <DatePickerWithRange
                            startDate={selectedStartDate}
                            endDate={selectedEndDate}
                            domain={selectedDomain}
                        />
                    </div>
                    <div className={`flex min-h-[58px] items-center justify-center rounded-[22px] border px-3 py-2 ${accentClasses.panel}`}>
                        <SelectDemo value={selectedDomain} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardHero
