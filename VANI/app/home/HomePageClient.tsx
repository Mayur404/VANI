"use client";

import { BriefcaseMedical, ChevronRight, CircleDollarSign, Info } from "lucide-react";
import { useState } from "react";
import { useDashboardDomain } from "@/store/useRecordingStore";
import { useRouter } from "next/navigation";

type HomePageClientProps = {
  data: Awaited<ReturnType<typeof import("@/lib/services/home.service").getHomePageData>>;
};

const HomePageClient = ({ data }: HomePageClientProps) => {
  const router = useRouter();
  const [selected, setSelected] = useState(false);
  const [choice, setChoice] = useState<"healthcare" | "finance" | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const setDashboardDomain = useDashboardDomain((state) => state.setDomain);

  const activity = data.recentActivity.slice(0, 3);

  return (
    <div className="w-full min-h-screen flex flex-col p-2 font-outfit bg-black">
      <div className="h-full w-full rounded-2xl flex flex-col items-center">
        <div className="h-full w-full flex items-center justify-center p-16">
          <div className="h-full w-full border border-gray-500 bg-[#0a0a0a] rounded-3xl flex flex-col items-center justify-center">
            <div className="w-full h-1/6 flex flex-col items-center justify-center mt-4 font-oxanium">
              <h1 className="font-bold text-white text-5xl m-2">
                Set up your{" "}
                <span
                  className={`${
                    choice === "healthcare"
                      ? "text-teal-500"
                      : choice === "finance"
                        ? "text-amber-500"
                        : "text-gray-500"
                  }`}
                >
                  Workspace
                </span>
              </h1>
              <h4 className="font-semibold text-amber-50 text-3xl m-2 text-center">
                IDRP adapts its AI model, terminology and report structure to match your domain.
              </h4>
            </div>
            <div className="w-full h-4/6 flex items-center justify-evenly p-16 gap-4">
              <div
                className={`relative h-full w-1/2 rounded-2xl p-16 flex flex-col items-start justify-start border border-teal-500/30 ${
                  choice === "healthcare" ? "bg-teal-500/20" : "bg-teal-500/5"
                } hover:border-sky-500/70 hover:shadow-[0_0_30px_rgba(14,165,233,0.1)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1`}
                onClick={() => {
                  setChoice("healthcare");
                  setSelected(true);
                  setDashboardDomain("healthcare");
                }}
              >
                <div className="w-fit h-fit bg-[#0a0a0a] p-4 rounded-2xl ml-3">
                  <BriefcaseMedical
                    size={50}
                    className="text-teal-500 transition-transform duration-200 ease-in-out hover:scale-[1.08]"
                  />
                </div>
                <div className="h-full w-full p-4 z-2">
                  <h1 className="text-white font-bold text-6xl font-oxanium">Healthcare</h1>
                  <h5 className="mt-2 mb-4 text-gray-500">Doctors · Hospitals · Clinics</h5>
                  <h4 className="text-gray-200 font-medium text-xl mt-4">
                    AI transcribes your patient conversations in various languages. Medical reports
                    generated automatically.
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mt-8">
                    <div className="bg-[#0f0e10] rounded-xl p-4">
                      <p className="text-xs text-[#9d9d9d] uppercase">Sessions</p>
                      <p className="text-3xl text-white font-semibold">
                        {data.summary.healthcareSessions}
                      </p>
                    </div>
                    <div className="bg-[#0f0e10] rounded-xl p-4">
                      <p className="text-xs text-[#9d9d9d] uppercase">Languages</p>
                      <p className="text-3xl text-white font-semibold">
                        {data.workspaceOptions.healthcare.supportedLanguages.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="h-full w-full">
                  {data.workspaceOptions.healthcare.supportedLanguages.map((language) => (
                    <button
                      key={language}
                      className={`p-2 w-fit h-fit text-white m-2 rounded-lg text-md border border-teal-500/50 ${
                        lang === language ? "bg-teal-600" : "bg-[#0a0a0a]"
                      }`}
                      onClick={() => setLang(language)}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className={`relative h-full w-1/2 rounded-2xl p-16 flex flex-col items-start justify-start border border-amber-500/30 ${
                  choice === "finance" ? "bg-amber-500/20" : "bg-amber-500/5"
                } hover:border-amber-500/70 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1`}
                onClick={() => {
                  setChoice("finance");
                  setSelected(true);
                  setDashboardDomain("finance");
                }}
              >
                <div className="w-fit h-fit bg-[#0a0a0a] p-4 rounded-2xl ml-3">
                  <CircleDollarSign
                    size={50}
                    className="text-amber-500 transition-transform duration-200 ease-in-out hover:scale-[1.08]"
                  />
                </div>
                <div className="h-full w-full p-4 z-2">
                  <h1 className="text-white font-bold text-6xl font-oxanium">Finance</h1>
                  <h5 className="mt-2 mb-4 text-gray-500">Banks · NBFCs · Loan Recovery</h5>
                  <h4 className="text-gray-200 font-medium text-xl mt-4">
                    AI conducts loan follow-up calls automatically. Payment data extracted. No
                    human agent required.
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mt-8">
                    <div className="bg-[#0f0e10] rounded-xl p-4">
                      <p className="text-xs text-[#9d9d9d] uppercase">Sessions</p>
                      <p className="text-3xl text-white font-semibold">
                        {data.summary.financeSessions}
                      </p>
                    </div>
                    <div className="bg-[#0f0e10] rounded-xl p-4">
                      <p className="text-xs text-[#9d9d9d] uppercase">Pending Calls</p>
                      <p className="text-3xl text-white font-semibold">{data.summary.pendingCalls}</p>
                    </div>
                  </div>
                </div>
                <div className="h-full w-full">
                  {data.workspaceOptions.finance.supportedLanguages.map((language) => (
                    <button
                      key={language}
                      className={`p-2 w-fit h-fit text-white m-2 rounded-lg text-md border border-amber-500/50 ${
                        lang === language ? "bg-amber-600" : "bg-[#0a0a0a]"
                      }`}
                      onClick={() => setLang(language)}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-full px-16 pb-6">
              <div className="grid grid-cols-3 gap-4">
                {activity.map((session) => (
                  <div key={session.id} className="bg-[#0f0e10] border border-[#1f1f1f] rounded-2xl p-4">
                    <p className="text-xs text-[#9d9d9d] uppercase">
                      {session.domain} · {session.language_detected ?? "unknown"}
                    </p>
                    <p className="text-xl text-white mt-2">
                      {session.patients?.name ?? session.customers?.name ?? "Unknown subject"}
                    </p>
                    <p className="text-sm text-[#9d9d9d] mt-1">
                      Owner: {session.users?.name ?? "Unassigned"}
                    </p>
                    <p className="text-sm text-[#bdbdbd] mt-3">
                      Latest alert: {session.alerts[0]?.message ?? "No recent alerts"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative w-full h-1/6 flex flex-col items-center justify-between">
              <h1 className="absolute text-white font-medium text-lg -translate-y-10">
                Your selection can be changed anytime in Settings → Workspace
              </h1>
              <div className="flex items-center justify-center gap-8">
                <div>
                  <Info size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium font-inter">
                    Domain settings affect the AI terminology and entity extraction models.
                  </h3>
                </div>
                <div>
                  <h1 className="text-2xl text-white">
                    {data.summary.activeAlerts} open alerts · {data.summary.activePrograms} active programs
                  </h1>
                </div>
                <button
                  disabled={!selected || !choice}
                  onClick={() => {
                    if (choice) {
                      router.push(`/callscheduling`);
                    }
                  }}
                  className={`flex items-center justify-center w-fit h-fit ${
                    selected && choice ? "bg-blue-500 hover:bg-blue-600 cursor-pointer" : "bg-gray-500 cursor-not-allowed opacity-50"
                  } transition-all duration-300 p-2 rounded-xl text-white disabled:opacity-50`}
                >
                  <h4 className="text-xl font-semibold">Continue</h4>
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageClient;
