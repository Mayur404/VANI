"use client";

import {
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle,
  DollarSign,
  Info,
  Monitor,
  Pill,
  User,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type AlertsPageData = Awaited<ReturnType<typeof import("@/lib/services/alerts.service").getAlertsPageData>>;
type Severity = "CRITICAL" | "MEDIUM" | "LOW" | "ACKNOWLEDGED";
type Filter = "All" | "Critical" | "Medium" | "Low" | "Acknowledged";

const tagIcons = {
  EMERGENCY: Zap,
  DOCTOR: User,
  PATIENT: User,
  FINANCE: DollarSign,
  PHARMACY: Pill,
  SYSTEM: Monitor,
} as const;

const tagColors = {
  EMERGENCY: "bg-red-500/20 text-red-400",
  DOCTOR: "bg-blue-500/20 text-blue-400",
  PATIENT: "bg-teal-500/20 text-teal-400",
  FINANCE: "bg-amber-500/20 text-amber-400",
  PHARMACY: "bg-purple-500/20 text-purple-400",
  SYSTEM: "bg-gray-500/20 text-gray-400",
} as const;

const severityBadgeColors = {
  CRITICAL: "bg-red-500/20 text-red-400",
  MEDIUM: "bg-amber-500/20 text-amber-400",
  LOW: "bg-gray-500/20 text-gray-400",
  ACKNOWLEDGED: "bg-gray-700/30 text-gray-500",
};

const formatRelative = (value?: Date | null) => {
  if (!value) return "Unknown";
  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

const normalizeSeverity = (value?: string | null, acknowledged = false): Severity => {
  if (acknowledged) return "ACKNOWLEDGED";
  if (value === "critical") return "CRITICAL";
  if (value === "medium") return "MEDIUM";
  return "LOW";
};

const AlertsCenterPageClient = ({ data }: { data: AlertsPageData }) => {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [acknowledgedIds, setAcknowledgedIds] = useState<number[]>([]);

  const alerts = useMemo(
    () =>
      data.alerts.map((alert) => {
        const isAcknowledged = Boolean(alert.acknowledged_at) || acknowledgedIds.includes(alert.id);
        return {
          ...alert,
          uiSeverity: normalizeSeverity(alert.severity, isAcknowledged),
          timeAgo: formatRelative(alert.created_at),
          title: alert.alert_type ? alert.alert_type.replaceAll("_", " ").toUpperCase() : "SYSTEM ALERT",
          description: alert.message ?? alert.trigger_text ?? "No description available.",
        };
      }),
    [acknowledgedIds, data.alerts],
  );

  const unresolvedCritical = alerts.filter((a) => a.uiSeverity === "CRITICAL").length;

  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === "All") return true;
    return alert.uiSeverity === activeFilter.toUpperCase();
  });

  const handleAcknowledge = (id: number) => {
    setAcknowledgedIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertTriangle size={16} />;
      case "MEDIUM":
        return <AlertCircle size={16} />;
      case "LOW":
        return <Info size={16} />;
      case "ACKNOWLEDGED":
        return <CheckCircle size={16} />;
    }
  };

  const latestCritical = data.latestCritical;

  return (
    <div className="h-[95vh] w-full flex flex-col bg-black font-lexend">
      <div className="h-full w-full flex flex-col items-center justify-center p-4">
        <div className="w-full h-fit flex flex-col gap-4 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white font-oxanium">Alerts Center</h1>
              <p className="text-sm text-[#9d9d9d] mt-2 max-w-xl">
                Monitor real-time critical health and financial triggers across active conversational sessions.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-[#0f0e10] rounded-xl px-4 py-3 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={20} className="text-red-500" />
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-red-500 font-oxanium">{unresolvedCritical}</span>
                <span className="text-xs text-[#9d9d9d] font-mono uppercase tracking-wider">
                  Unresolved Critical
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-fit flex items-center justify-start gap-4 p-4">
          {(["All", "Critical", "Medium", "Low", "Acknowledged"] as const).map((filter) => (
            <div key={filter} className="h-full w-fit p-4" onClick={() => setActiveFilter(filter)}>
              <span className={`text-xl font-semibold text-white ${activeFilter === filter ? "border-b-4 border-white" : ""} p-2`}>
                {filter}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full h-fit flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-4">
            {filteredAlerts.map((alert) => {
              const isLarge = alert.uiSeverity === "CRITICAL";

              return (
                <div
                  key={alert.id}
                  className={`${isLarge ? "col-span-3" : "col-span-1"} bg-[#0a0a0a] rounded-2xl p-4 flex flex-col gap-3 ${
                    alert.uiSeverity === "CRITICAL" ? "border-l-4 border-red-500 bg-[rgba(239,68,68,0.05)]" : ""
                  } transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${severityBadgeColors[alert.uiSeverity]}`}>
                      {getSeverityIcon(alert.uiSeverity)}
                      <span className="text-xs font-semibold uppercase tracking-wider">{alert.uiSeverity}</span>
                    </div>
                    <span className="text-xs text-[#9d9d9d] font-mono">{alert.timeAgo}</span>
                  </div>

                  <h2 className={`text-white font-semibold font-oxanium ${isLarge ? "text-xl" : "text-lg"}`}>
                    {alert.title}
                  </h2>

                  <p className="text-[#9d9d9d] text-sm line-clamp-3">{alert.description}</p>

                  <p className="text-sm text-[#d4d4d4]">
                    {alert.subjectName ?? "Unknown subject"} · {alert.ownerName ?? "Unassigned"} · Session #{alert.session_id}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {alert.tags.map((tag) => {
                      const TagIcon = tagIcons[tag as keyof typeof tagIcons];
                      return (
                        <div key={tag} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tagColors[tag as keyof typeof tagColors]}`}>
                          <TagIcon size={12} />
                          {tag}
                        </div>
                      );
                    })}
                  </div>

                  {alert.uiSeverity === "ACKNOWLEDGED" ? (
                    <div className="flex items-center gap-2 text-[#9d9d9d] text-sm pt-2">
                      <Bot size={14} />
                      <span>Handled by System</span>
                    </div>
                  ) : isLarge ? (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                      >
                        Immediate Override
                      </button>
                      <button className="flex-1 bg-[#1a1a1a] hover:bg-[#2c2c2c] text-white border border-[#2c2c2c] py-2 rounded-xl text-sm font-semibold transition-all duration-200">
                        Review Session
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="w-full bg-[#1a1a1a] hover:bg-[#2c2c2c] text-white py-2 rounded-xl text-sm font-semibold transition-all duration-200 border border-[#2c2c2c]"
                    >
                      Acknowledge Alert
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full h-fit p-4">
          <div className="bg-[#0a0a0a] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-white font-oxanium">Alert Trends</h1>
                <p className="text-sm text-[#9d9d9d] mt-1">
                  Latest critical alert: {latestCritical?.message ?? latestCritical?.trigger_text ?? "No critical alerts found."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="text-3xl font-bold text-white font-oxanium">{data.counts.critical}</div>
                <div className="text-xs text-[#9d9d9d] font-mono uppercase mt-1">Critical Open</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="text-3xl font-bold text-white font-oxanium">{data.counts.medium}</div>
                <div className="text-xs text-[#9d9d9d] font-mono uppercase mt-1">Medium Open</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="text-3xl font-bold text-white font-oxanium">{data.counts.low}</div>
                <div className="text-xs text-[#9d9d9d] font-mono uppercase mt-1">Low Open</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="text-3xl font-bold text-white font-oxanium">{data.counts.acknowledged}</div>
                <div className="text-xs text-[#9d9d9d] font-mono uppercase mt-1">Acknowledged</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-[#9d9d9d] font-mono">
                7-day alert volume: {data.trend.reduce((sum, item) => sum + item.total, 0)}
              </span>
              <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2b7fff] rounded-full"
                  style={{
                    width: `${Math.min(100, data.counts.totalOpen === 0 ? 0 : (data.counts.critical / data.counts.totalOpen) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsCenterPageClient;
