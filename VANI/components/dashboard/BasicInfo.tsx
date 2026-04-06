
type BasicInfoProps = {
    totalSessions: number;
    averageDuration: number;
    satisfactionScore: number;
    totalPatients: number;
    totalSessionsChange: number;
    averageDurationChange: number;
    domain: "all" | "healthcare" | "finance";
};

const BasicInfo = ({
    totalSessions,
    averageDuration,
    satisfactionScore,
    totalPatients,
    totalSessionsChange,
    averageDurationChange,
    domain,
}: BasicInfoProps) => {
    const basicInfo = [
        {
            title: "TOTAL SESSIONS",
            value: totalSessions,
            change: `${totalSessionsChange}%`,
        },
        {
            title: "AVERAGE DURATION",
            value: `${averageDuration}s`,
            change: `${averageDurationChange}%`,
        },
        {
            title: "SATISFACTION SCORE",
            value: satisfactionScore,
            change: "Good",
        }, {
            title: "TOTAL PATIENTS",
            value: totalPatients,
            change: "17%",
        },
    ]

    const getBadgeStyles = (change: string) => {
        if (change.toLowerCase() === "good") {
            return domain === "finance"
                ? "border-amber-400/40 bg-amber-500/15 text-amber-300"
                : "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
        }

        if (change.startsWith("-")) {
            return "border-rose-400/40 bg-rose-500/15 text-rose-300"
        }

        return domain === "finance"
            ? "border-amber-400/40 bg-amber-500/15 text-amber-300"
            : "border-cyan-400/40 bg-cyan-500/15 text-cyan-300"
    }

    return (
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {
                basicInfo.map((info, index) => (
                    <div
                        key={index}
                        className="relative min-h-[190px] overflow-hidden rounded-[28px] border border-[#171717] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.05),_transparent_45%),#0a0a0a] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.32)]"
                    >
                        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/4 blur-3xl" />
                        <h2 className='text-sm font-semibold tracking-[0.28em] text-[#8d8d8d]'>{info.title}</h2>
                        <h1 className='mt-8 text-5xl font-semibold text-white xl:text-6xl'>{info.value}</h1>
                        <div className={`absolute bottom-5 right-5 rounded-full border px-3 py-1.5 text-sm font-semibold ${getBadgeStyles(info.change)}`}>
                            {info.change}
                        </div>
                        <p className='mt-4 max-w-[70%] text-sm text-[#888]'>
                            Snapshot from the currently selected reporting range.
                        </p>
                    </div>
                ))
            }
        </div>
    )
}

export default BasicInfo
