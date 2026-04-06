"use client";

import { ArrowLeft, ArrowRight, Info, Video } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type CallsSchedulingPageData = Awaited<
  ReturnType<typeof import("@/lib/services/callscheduling.service").getCallsSchedulingPageData>
>;

type ScheduledCall = CallsSchedulingPageData["upcomingCalls"][number];

const formatTime = (value: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));

const formatAmount = (value: number | null | undefined) =>
  value == null
    ? "Unavailable"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);

const formatStatus = (value: string | null | undefined) => (value ? value.replaceAll("_", " ") : "pending");

const getStatusAccent = (status: string | null | undefined) => {
  if (status === "completed") return "bg-emerald-500";
  if (status === "failed") return "bg-rose-500";
  if (status === "initiated") return "bg-sky-500";
  return "bg-amber-500";
};

const getStatusBadge = (status: string | null | undefined) => {
  if (status === "completed") return "border-emerald-500/30 bg-emerald-500/12 text-emerald-300";
  if (status === "failed") return "border-rose-500/30 bg-rose-500/12 text-rose-300";
  if (status === "initiated") return "border-sky-500/30 bg-sky-500/12 text-sky-300";
  return "border-amber-500/30 bg-amber-500/12 text-amber-300";
};

const SummaryCard = ({
  day,
  totalCalls,
  pendingCalls,
  initiatedCalls,
  completedCalls,
  failedCalls,
}: CallsSchedulingPageData["weekSummary"][number]) => (
  <div className="rounded-[26px] border border-[#171717] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%),#0a0a0a] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
    <div className="flex items-start justify-between">
      <h2 className="text-2xl font-semibold text-white">{day}</h2>
      <div className="flex items-center gap-2">
        {pendingCalls > 0 && <div className="h-3 w-3 rounded-full bg-amber-500" />}
        {initiatedCalls > 0 && <div className="h-3 w-3 rounded-full bg-sky-500" />}
        {completedCalls > 0 && <div className="h-3 w-3 rounded-full bg-emerald-500" />}
        {failedCalls > 0 && <div className="h-3 w-3 rounded-full bg-rose-500" />}
      </div>
    </div>
    <div className="mt-6 flex items-end justify-between">
      <p className="text-5xl font-semibold text-white">{totalCalls}</p>
      <span className="rounded-full border border-[#222] bg-[#121212] px-3 py-1 text-xs uppercase tracking-[0.25em] text-[#9d9d9d]">
        calls
      </span>
    </div>
  </div>
);

const ScheduledCallsPageClient = ({ data }: { data: CallsSchedulingPageData }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [selectedCallId, setSelectedCallId] = useState<number | null>(
    data.upcomingCalls[0]?.id ?? data.pastCalls[0]?.id ?? null,
  );

  const selectedCalls = tab === "upcoming" ? data.upcomingCalls : data.pastCalls;
  const activeCall = useMemo(
    () => selectedCalls.find((call) => call.id === selectedCallId) ?? selectedCalls[0] ?? null,
    [selectedCallId, selectedCalls],
  );

  const handleViewMore = (call: ScheduledCall) => {
    setSelectedCallId(call.id);
    setExpanded(true);
  };

  const handleJoinNow = (call: ScheduledCall) => {
    const params = new URLSearchParams({
      name: call.customers?.name ?? "Unknown customer",
      id: call.customers?.loan_account_number ?? String(call.id),
      phone: call.phone_number ?? call.customers?.phone_number ?? "",
      domain: "finance",
      amount: String(call.customers?.outstanding_amount ?? 0),
      bank: "VANI Finance",
      agent: call.sessions?.users?.name ?? "VANI Agent",
      scheduledCallId: String(call.id),
      autoStartScheduled: "false",
    });

    router.push(`/call?${params.toString()}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] font-oxanium text-white">
      <div className="flex w-full items-center justify-center gap-4 px-6 pb-2 pt-6">
        <div className="flex w-1/3 items-center justify-start">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-[#727272]">Operations Queue</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Scheduled Calls</h1>
          </div>
        </div>
        <div className="w-1/3" />
        <div className="flex w-1/3 items-center justify-end gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1d1d1d] bg-[#0d0d0d] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <ArrowLeft size={20} className="text-[#f4f4f4]" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1d1d1d] bg-[#0d0d0d] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <ArrowRight size={20} className="text-[#f4f4f4]" />
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-4 px-6 py-4 md:grid-cols-3 xl:grid-cols-7">
        {data.weekSummary.map((day) => (
          <SummaryCard key={day.day} {...day} />
        ))}
      </div>

      <div className="flex w-full flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center justify-start gap-3">
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-200 ${
              tab === "upcoming"
                ? "border border-[#2a2a2a] bg-[#121212] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "text-[#a0a0a0] hover:bg-[#101010] hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              Upcoming Sessions
              <span className="rounded-full bg-[#1c1c1c] px-2.5 py-1 text-xs text-[#d0d0d0]">
                {data.upcomingCalls.length}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("past")}
            className={`rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-200 ${
              tab === "past"
                ? "border border-[#2a2a2a] bg-[#121212] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "text-[#a0a0a0] hover:bg-[#101010] hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              Past Logs
              <span className="rounded-full bg-[#1c1c1c] px-2.5 py-1 text-xs text-[#d0d0d0]">
                {data.pastCalls.length}
              </span>
            </span>
          </button>
        </div>
        <div className="flex w-full items-center justify-end gap-4">
          <button
            className="rounded-2xl border border-[#1f1f1f] bg-[#0e0e0e] px-5 py-3 text-sm font-semibold tracking-[0.18em] text-white transition-colors duration-200 hover:bg-[#141414]"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "HIDE DETAILS" : "VIEW DETAILS"}
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 px-6 py-2 xl:flex-row">
        <div
          className={`${
            expanded ? "xl:w-[58%]" : "w-full"
          } flex min-h-[520px] flex-col gap-4 rounded-[28px] border border-[#151515] bg-[#080808] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-all duration-700`}
        >
          {selectedCalls.map((call) => (
            <div
              key={call.id}
              className={`grid min-h-[154px] grid-cols-1 gap-4 rounded-[24px] border p-4 text-white transition-all duration-200 xl:grid-cols-[148px_minmax(0,1.15fr)_minmax(0,1.4fr)_150px_150px] ${
                activeCall?.id === call.id
                  ? "border-[#303030] bg-[linear-gradient(135deg,rgba(34,34,34,0.96),rgba(14,14,14,0.98))] shadow-[0_16px_45px_rgba(0,0,0,0.32)]"
                  : "border-[#171717] bg-[#0c0c0c] hover:border-[#262626] hover:bg-[#101010]"
              }`}
            >
              <div className="relative flex h-full flex-col justify-center rounded-[20px] border border-[#1f1f1f] bg-[#111111] px-5 py-4">
                <div
                  className={`absolute left-0 top-3 h-[calc(100%-24px)] w-1.5 rounded-r-xl ${getStatusAccent(call.status)}`}
                />
                <p className="text-xs uppercase tracking-[0.35em] text-[#7c7c7c]">Scheduled</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">{formatTime(call.scheduled_time)}</h2>
                <span
                  className={`mt-3 w-fit rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${getStatusBadge(call.status)}`}
                >
                  {formatStatus(call.status)}
                </span>
              </div>

              <div className="flex h-full items-center gap-4 rounded-[20px] border border-[#171717] bg-[#0f0f0f] px-4 py-3">
                <Image
                  src="/profilepic.png"
                  alt="profile_pic"
                  className="rounded-full border border-[#2c2c2c]"
                  width={68}
                  height={68}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-2xl text-white">{call.customers?.name ?? "Unknown customer"}</h3>
                  <div className="mt-2 text-sm uppercase tracking-[0.2em] text-[#8d8d8d]">
                    {call.sessions?.finance_reports[0]?.next_action?.replaceAll("_", " ") ?? "Follow up"}
                  </div>
                  <p className="mt-3 truncate text-sm text-[#bdbdbd]">
                    {call.customers?.loan_account_number ?? "Loan account unavailable"}
                  </p>
                </div>
              </div>

              <div className="flex h-full min-w-0 flex-col justify-between rounded-[20px] border border-[#171717] bg-[#0f0f0f] p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#6f6f6f]">Reason</p>
                <div className="mt-3 line-clamp-3 text-sm leading-6 text-[#dbdbdb]">
                  {call.reason ?? "No reason recorded."}
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[#7e7e7e]">
                  Outstanding {formatAmount(call.customers?.outstanding_amount ?? null)}
                </p>
              </div>

              <div className="flex h-full items-stretch justify-center">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-[#272727] bg-[#171717] px-4 py-4 text-base font-semibold transition-all duration-200 hover:border-[#3a3a3a] hover:bg-[#1d1d1d]"
                  onClick={() => handleViewMore(call)}
                >
                  <Info size={18} />
                  View More
                </button>
              </div>

              <div className="flex h-full items-stretch justify-center">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] px-4 py-4 text-base font-semibold shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => handleJoinNow(call)}
                >
                  <Video size={18} />
                  Join Now
                </button>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`${
            expanded ? "xl:w-[42%]" : "w-0"
          } flex transition-all duration-700 ${expanded ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          {activeCall ? (
            <div className="w-full rounded-[28px] border border-[#171717] bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.09),_transparent_45%),#0d0d0d] p-6 text-white shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#7a7a7a]">Selected Profile</p>
                  <h2 className="mt-3 text-3xl font-semibold">{activeCall.customers?.name ?? "Unknown customer"}</h2>
                </div>
                <span
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${getStatusBadge(activeCall.status)}`}
                >
                  {formatStatus(activeCall.status)}
                </span>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[#1d1d1d] bg-[#121212] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#767676]">Phone</p>
                  <p className="mt-2 text-base text-[#e8e8e8]">{activeCall.phone_number ?? "Unavailable"}</p>
                </div>
                <div className="rounded-2xl border border-[#1d1d1d] bg-[#121212] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#767676]">Loan Account</p>
                  <p className="mt-2 text-base text-[#e8e8e8]">
                    {activeCall.customers?.loan_account_number ?? "Unavailable"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1d1d1d] bg-[#121212] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#767676]">Scheduled</p>
                  <p className="mt-2 text-base text-[#e8e8e8]">
                    {new Date(activeCall.scheduled_time).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1d1d1d] bg-[#121212] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#767676]">Outstanding</p>
                  <p className="mt-2 text-base text-[#e8e8e8]">
                    {formatAmount(activeCall.customers?.outstanding_amount ?? null)}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[24px] border border-[#1b1b1b] bg-[#101010] p-5">
                <p className="text-xs uppercase tracking-[0.32em] text-[#767676]">Call Context</p>
                <p className="mt-4 text-sm leading-7 text-[#d4d4d4]">
                  {activeCall.reason ?? "No reason recorded."}
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-[#171717] bg-[#101010] px-4 py-3">
                  <p className="text-sm text-[#8f8f8f]">Last payment status</p>
                  <p className="text-sm font-semibold text-white">
                    {activeCall.sessions?.finance_reports[0]?.payment_status ?? "Unknown"}
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#171717] bg-[#101010] px-4 py-3">
                  <p className="text-sm text-[#8f8f8f]">Next action</p>
                  <p className="text-right text-sm font-semibold text-white">
                    {activeCall.sessions?.finance_reports[0]?.next_action?.replaceAll("_", " ") ?? "Not set"}
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#171717] bg-[#101010] px-4 py-3">
                  <p className="text-sm text-[#8f8f8f]">Assigned agent</p>
                  <p className="text-sm font-semibold text-white">
                    {activeCall.sessions?.users?.name ?? "Unassigned"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#171717] bg-[#101010] px-4 py-3">
                  <p className="text-sm text-[#8f8f8f]">Latest alert</p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    {activeCall.sessions?.alerts[0]?.message ?? "No linked alert"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex w-full gap-4 px-6 pb-8 pt-4">
        <div className="flex w-full items-center justify-center gap-4">
          <div className="grid w-full grid-cols-1 gap-4 rounded-[28px] border border-[#171717] bg-[#0b0b0b] p-6 text-white md:grid-cols-3">
            <div className="rounded-2xl border border-[#151515] bg-[#101010] p-4">
              <p className="text-sm uppercase tracking-[0.28em] text-[#888]">Upcoming</p>
              <p className="mt-3 text-4xl">{data.upcomingCalls.length}</p>
            </div>
            <div className="rounded-2xl border border-[#151515] bg-[#101010] p-4">
              <p className="text-sm uppercase tracking-[0.28em] text-[#888]">Past</p>
              <p className="mt-3 text-4xl">{data.pastCalls.length}</p>
            </div>
            <div className="rounded-2xl border border-[#151515] bg-[#101010] p-4">
              <p className="text-sm uppercase tracking-[0.28em] text-[#888]">This Week</p>
              <p className="mt-3 text-4xl">
                {data.weekSummary.reduce((sum, item) => sum + item.totalCalls, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledCallsPageClient;
