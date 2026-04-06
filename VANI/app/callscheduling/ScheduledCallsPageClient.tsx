"use client";

import { ArrowLeft, ArrowRight, Info, Video } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useDashboardDomain } from "@/store/useRecordingStore";

type CallsSchedulingPageData = Awaited<
  ReturnType<typeof import("@/lib/services/callscheduling.service").getCallsSchedulingPageData>
>;

type PatientsListData = Awaited<
  ReturnType<typeof import("@/lib/services/basic.service").getPatientsList>
>;

const formatTime = (value: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));

const ScheduledCallsPageClient = ({ data, patients }: { data: CallsSchedulingPageData; patients: PatientsListData }) => {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const router = useRouter();
  const domain = useDashboardDomain((state) => state.domain);
  const isFinance = String(domain).toLowerCase() === "finance";

  const selectedCalls = tab === "upcoming" ? data.upcomingCalls : data.pastCalls;
  const activeCall = useMemo(() => selectedCalls[0] ?? null, [selectedCalls]);

  const handleJoinNow = (call: CallsSchedulingPageData["upcomingCalls"][number] | CallsSchedulingPageData["pastCalls"][number]) => {
    const params = new URLSearchParams({
      name: call.customers?.name ?? "Unknown customer",
      id: call.customers?.loan_account_number ?? String(call.id),
      phone: call.phone_number ?? call.customers?.phone_number ?? "",
      domain: "finance",
      amount: String(call.customers?.outstanding_amount ?? 0),
      bank: "VANI Finance",
      agent: call.sessions?.users?.name ?? "VANI Agent",
      scheduledCallId: String(call.id),
    });

    router.push(`/call?${params.toString()}`);
  };

  const handlePatientCall = (patient: PatientsListData[number]) => {
    const params = new URLSearchParams({
      name: patient.name,
      id: patient.insurance_id ?? String(patient.id),
      phone: patient.phone_number ?? "",
      domain: "healthcare",
      amount: "0",
      bank: patient.sessions[0]?.users?.organisation ?? "VANI Care",
      agent: patient.sessions[0]?.users?.name ?? "Assigned Doctor",
    });

    router.push(`/call?${params.toString()}`);
  };

  const handleViewProfile = (patient: PatientsListData[number]) => {
    const params = new URLSearchParams({
      domain: "healthcare",
      id: String(patient.id),
    });
    router.push(`/userprofile?${params.toString()}`);
  };

  // ─── HEALTHCARE VIEW ─────────────────────────────────────
  if (!isFinance) {
    return (
      <div className="w-full min-h-screen flex flex-col font-oxanium bg-black">
        <div className="w-full h-1/12 flex items-center justify-center gap-4 p-4">
          <div className="h-full w-1/3 flex items-center justify-start">
            <h1 className="text-3xl font-semibold text-white m-4">PATIENT SESSIONS</h1>
          </div>
          <div className="h-full w-1/3" />
          <div className="h-full w-1/3 flex items-center justify-end gap-4 p-2">
            <div className="px-4 py-2 bg-teal-500/20 border border-teal-500/30 rounded-xl">
              <span className="text-teal-400 text-sm font-semibold">HEALTHCARE MODE</span>
            </div>
          </div>
        </div>

        <div className="w-full flex-1 rounded-2xl flex flex-col gap-4 p-4">
          {patients.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[#9d9d9d] text-xl">No patients found in the system.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {patients.map((patient) => {
                const lastReport = patient.healthcare_reports[0];
                const lastSession = patient.sessions[0];
                return (
                  <div
                    key={patient.id}
                    className="bg-[#0a0a0a] rounded-2xl font-semibold text-white flex items-center justify-center gap-4 p-4"
                  >
                    <div className="relative h-full w-1/8 flex flex-col items-center justify-center border-r-[#9d9d9d] border-r pr-4">
                      <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-teal-500/50 flex items-center justify-center">
                        <span className="text-xl font-bold text-teal-500">
                          {patient.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                    </div>
                    <div className="h-full w-2/8 flex flex-col justify-center gap-1 p-2">
                      <h1 className="text-2xl text-white">{patient.name}</h1>
                      <div className="text-sm text-[#9d9d9d]">
                        ID: {patient.insurance_id ?? `P-${patient.id}`} · {patient.age ? `${patient.age}y` : ""} {patient.gender ?? ""}
                      </div>
                    </div>
                    <div className="h-full w-2/8 flex flex-col justify-center gap-1 p-2">
                      {lastReport && (
                        <>
                          <div className="text-sm text-[#9d9d9d]">
                            Last: {lastReport.chief_complaint?.slice(0, 40) ?? "No complaint"}
                          </div>
                          <div className="flex gap-2 mt-1">
                            {lastReport.severity && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                lastReport.severity === "severe" ? "bg-red-500/30 text-red-400" :
                                lastReport.severity === "moderate" ? "bg-amber-500/30 text-amber-400" :
                                "bg-green-500/30 text-green-400"
                              }`}>
                                {lastReport.severity.toUpperCase()}
                              </span>
                            )}
                            {lastReport.visit_type && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-400">
                                {lastReport.visit_type.replaceAll("_", " ").toUpperCase()}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                      {!lastReport && (
                        <div className="text-sm text-[#6b6b6b]">No reports yet</div>
                      )}
                    </div>
                    <div className="h-full w-1/8 flex flex-col justify-center p-2">
                      <div className="text-sm text-[#9d9d9d]">
                        {lastSession?.completed_at ? `Last: ${new Date(lastSession.completed_at).toLocaleDateString("en-IN")}` : "No sessions"}
                      </div>
                    </div>
                    <div className="h-full w-1/8 flex items-center justify-center gap-2 p-2">
                      <button
                        className="w-full h-full bg-[#1f1f1f] rounded-xl text-lg flex items-center justify-center gap-2 p-3"
                        onClick={() => handleViewProfile(patient)}
                      >
                        <Info size={18} />
                        Profile
                      </button>
                    </div>
                    <div className="h-full w-1/8 flex items-center justify-center gap-2 p-2">
                      <button
                        className="w-full h-full bg-teal-600 rounded-xl text-lg flex items-center justify-center gap-2 p-3"
                        onClick={() => handlePatientCall(patient)}
                      >
                        <Video size={18} />
                        Call
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-full h-2/12 rounded-t-xl flex gap-4 px-4">
          <div className="w-full h-full flex items-center justify-center gap-4 px-4">
            <div className="w-full h-full rounded-t-xl bg-[#0a0a0a11] flex items-center justify-around text-white">
              <div>
                <p className="text-sm text-[#9d9d9d]">Total Patients</p>
                <p className="text-3xl">{patients.length}</p>
              </div>
              <div>
                <p className="text-sm text-[#9d9d9d]">With Reports</p>
                <p className="text-3xl">{patients.filter(p => p.healthcare_reports.length > 0).length}</p>
              </div>
              <div>
                <p className="text-sm text-[#9d9d9d]">Recent Sessions</p>
                <p className="text-3xl">{patients.filter(p => p.sessions.length > 0).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── FINANCE VIEW (existing) ──────────────────────────────
  return (
    <div className="w-full min-h-screen flex flex-col font-oxanium bg-black">
      <div className="w-full h-1/12 flex items-center justify-center gap-4 p-4">
        <div className="h-full w-1/3 flex items-center justify-start">
          <h1 className="text-3xl font-semibold text-white m-4">SCHEDULED CALLS</h1>
        </div>
        <div className="h-full w-1/3" />
        <div className="h-full w-1/3 flex items-center justify-end gap-4 p-2">
          <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
            <span className="text-amber-400 text-sm font-semibold">FINANCE MODE</span>
          </div>
          <div className="h-full w-fit bg-[#0f0e10] flex items-center justify-center rounded-xl p-4">
            <ArrowLeft size={24} className="text-white font-bold" />
          </div>
          <div className="h-full w-fit bg-[#0f0e10] flex items-center justify-center rounded-xl p-4">
            <ArrowRight size={24} className="text-white font-bold" />
          </div>
        </div>
      </div>

      <div className="w-full h-2/12 flex items-center justify-center gap-4 p-4">
        {data.weekSummary.map((das) => (
          <div key={das.day} className="h-full w-1/7 bg-[#0a0a0a] rounded-2xl">
            <h1 className="text-3xl font-semibold text-white m-4">{das.day}</h1>
            <div className="w-full h-1/2 text-start flex">
              <h1 className="text-5xl font-semibold text-white m-4">{das.totalCalls}</h1>
              <div className="h-full w-1/2 flex items-center gap-2">
                {das.pendingCalls > 0 && <div className="h-3 w-3 rounded-full bg-amber-500" />}
                {das.initiatedCalls > 0 && <div className="h-3 w-3 rounded-full bg-blue-500" />}
                {das.completedCalls > 0 && <div className="h-3 w-3 rounded-full bg-green-500" />}
                {das.failedCalls > 0 && <div className="h-3 w-3 rounded-full bg-red-500" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full h-16 flex items-center justify-evenly gap-4 p-4">
        <div className="h-full w-full flex items-center justify-start gap-4">
          <div className="h-full w-fit p-4" onClick={() => setTab("upcoming")}>
            <span className={`text-xl font-semibold text-white p-2 ${tab === "upcoming" ? "border-b-4 border-white" : ""}`}>
              Upcoming Sessions
            </span>
          </div>
          <div className="h-full w-fit p-4" onClick={() => setTab("past")}>
            <span className={`text-xl font-semibold text-white p-2 ${tab === "past" ? "border-b-4 border-white" : ""}`}>
              Past Logs
            </span>
          </div>
        </div>
        <div className="h-full w-full flex items-center justify-end gap-4 p-4">
          <button
            className="h-full w-fit p-4 bg-[#0f0e10] flex items-center justify-center rounded-xl text-sm font-semibold text-white"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "HIDE DETAILS" : "VIEW DETAILS"}
          </button>
        </div>
      </div>

      <div className="w-full h-6/12 rounded-2xl flex gap-4 p-4">
        <div className={`${expanded ? "w-1/2" : "w-full"} h-full rounded-2xl flex flex-col gap-4 p-4 transition-all duration-700`}>
          {selectedCalls.map((call) => (
            <div
              key={call.id}
              className="h-1/4 bg-[#0a0a0a] rounded-2xl font-semibold text-2xl text-white flex items-center justify-center gap-4 p-2"
            >
              <div className="relative h-full w-1/8 flex flex-col items-center justify-center border-r-[#9d9d9d] border-r">
                <h1 className="text-3xl font-semibold text-white">{formatTime(call.scheduled_time)}</h1>
                <h3 className="text-lg font-semibold text-[#9d9d9d]">{call.status?.replaceAll("_", " ")}</h3>
                <div
                  className={`absolute w-2 h-full left-0 rounded-r-xl ${
                    call.status === "completed"
                      ? "bg-green-500"
                      : call.status === "failed"
                        ? "bg-red-500"
                        : call.status === "initiated"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                  }`}
                />
              </div>
              <div className="h-full w-2/8 flex items-center justify-center gap-4 p-2">
                <div className="h-full w-1/3 flex items-center justify-center">
                  <Image src="/profilepic.png" alt="profile_pic" className="rounded-full" width={64} height={64} />
                </div>
                <div className="h-full w-2/3 flex flex-col items-center justify-center">
                  <h1 className="text-2xl text-white pt-1">{call.customers?.name ?? "Unknown customer"}</h1>
                  <div className="text-sm text-[#9d9d9d] pb-1">
                    {call.sessions?.finance_reports[0]?.next_action?.replaceAll("_", " ") ?? "Follow up"}
                  </div>
                </div>
              </div>
              <div className="h-full w-3/8 flex items-center justify-center gap-4 p-4">
                <div className="h-full w-full text-sm text-[#dbdbdb]">{call.reason ?? "No reason recorded."}</div>
              </div>
              <div className="h-full w-1/8 flex items-center justify-center gap-4 p-4">
                <button
                  className="w-full h-full bg-[#1f1f1f] rounded-xl text-lg flex items-center justify-center gap-2"
                  onClick={() => setExpanded(true)}
                >
                  <Info />
                  View More
                </button>
              </div>
              <div className="h-full w-1/8 flex items-center justify-center gap-4 p-4">
                <button
                  className="w-full h-full bg-blue-500 rounded-xl text-lg flex items-center justify-center gap-2"
                  onClick={() => handleJoinNow(call)}
                >
                  <Video />
                  Join Now
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={`h-full ${expanded ? "w-1/2" : "w-0"} flex gap-4 p-4 transition-all duration-700`}>
          {activeCall && (
            <div className="h-full w-full rounded-2xl bg-[#0f0e10] p-6 text-white">
              <h2 className="text-2xl font-semibold">{activeCall.customers?.name ?? "Unknown customer"}</h2>
              <p className="text-[#9d9d9d] mt-2">Phone: {activeCall.phone_number ?? "Unavailable"}</p>
              <p className="text-[#9d9d9d] mt-2">
                Scheduled: {new Date(activeCall.scheduled_time).toLocaleString("en-IN")}
              </p>
              <p className="text-[#9d9d9d] mt-2">Status: {activeCall.status?.replaceAll("_", " ")}</p>
              <p className="mt-6 text-sm text-[#d4d4d4]">{activeCall.reason ?? "No reason recorded."}</p>
              <div className="mt-6 space-y-3">
                <p className="text-sm text-[#9d9d9d]">
                  Last payment status: {activeCall.sessions?.finance_reports[0]?.payment_status ?? "Unknown"}
                </p>
                <p className="text-sm text-[#9d9d9d]">
                  Assigned agent: {activeCall.sessions?.users?.name ?? "Unassigned"}
                </p>
                <p className="text-sm text-[#9d9d9d]">
                  Latest alert: {activeCall.sessions?.alerts[0]?.message ?? "No linked alert"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-2/12 rounded-t-xl flex gap-4 px-4">
        <div className="w-full h-full flex items-center justify-center gap-4 px-4">
          <div className="w-full h-full rounded-t-xl bg-[#0a0a0a11] flex items-center justify-around text-white">
            <div>
              <p className="text-sm text-[#9d9d9d]">Upcoming</p>
              <p className="text-3xl">{data.upcomingCalls.length}</p>
            </div>
            <div>
              <p className="text-sm text-[#9d9d9d]">Past</p>
              <p className="text-3xl">{data.pastCalls.length}</p>
            </div>
            <div>
              <p className="text-sm text-[#9d9d9d]">This Week</p>
              <p className="text-3xl">{data.weekSummary.reduce((sum, item) => sum + item.totalCalls, 0)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledCallsPageClient;
