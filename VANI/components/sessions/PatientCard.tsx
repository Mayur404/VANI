"use client";

import { Calendar, Droplet, Info, Phone } from "lucide-react";

interface Patient {
  id: number;
  name: string;
  phone_number: string | null;
  age: number | null;
  blood_group: string | null;
  insurance_id: string | null;
  chronic_conditions: string | null;
  healthcare_reports?: {
    severity?: string;
  }[];
}

interface PatientCardProps {
  patient: Patient;
  onClick: (patient: Patient) => void;
  onInfoClick: (patient: Patient) => void;
}

export function PatientCard({ patient, onClick, onInfoClick }: PatientCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = () => {
    if (!patient.healthcare_reports?.length) return null;
    const report = patient.healthcare_reports[0];
    if (report.severity === "critical") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
          Critical
        </span>
      );
    }
    if (report.severity === "opd") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
          OPD
        </span>
      );
    }
    return null;
  };

  const getConditionTag = () => {
    if (!patient.chronic_conditions) {
      return <span className="text-xs text-[#6b6b6b] font-lexend">No conditions noted</span>;
    }
    try {
      const conditions = JSON.parse(patient.chronic_conditions);
      if (Array.isArray(conditions) && conditions.length > 0) {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#1a1a1a] text-[#9d9d9d] border border-[#2c2c2c]">
            {conditions[0]}
          </span>
        );
      }
    } catch {
      // If JSON parsing fails, treat as plain text
      if (patient.chronic_conditions.trim()) {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#1a1a1a] text-[#9d9d9d] border border-[#2c2c2c]">
            {patient.chronic_conditions.split(",")[0].trim()}
          </span>
        );
      }
    }
    return <span className="text-xs text-[#6b6b6b] font-lexend">No conditions noted</span>;
  };

  const getLastSessionInfo = () => {
    // TODO: Replace with actual last session date when available
    return (
      <span className="text-xs text-teal-400 font-mono">New patient</span>
    );
  };

  return (
    <div
      onClick={() => onClick(patient)}
      className="bg-[#0a0a0a] border border-[rgba(51,65,85,0.4)] rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-[rgba(14,165,233,0.4)] hover:bg-[rgba(14,165,233,0.04)] hover:-translate-y-0.5"
    >
      {/* Top row - avatar and name */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center">
            <span className="text-lg font-bold font-oxanium text-[#3B82F6]">
              {getInitials(patient.name)}
            </span>
          </div>
          {/* Name and ID */}
          <div>
            <h3 className="text-white font-medium font-outfit text-sm">{patient.name}</h3>
            <p className="text-[#6b6b6b] text-xs font-mono">ID: #{String(patient.id).padStart(5, "0")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onInfoClick(patient);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2c2c2c] bg-[#111111] text-[#9d9d9d] transition-colors hover:border-teal-500/40 hover:text-white"
            aria-label={`Open profile for ${patient.name}`}
          >
            <Info size={14} />
          </button>
        </div>
      </div>

      {/* Middle row - info items */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <Phone size={14} className="text-[#6b6b6b]" />
          <span className="text-[#6b6b6b] text-xs font-lexend">
            {patient.phone_number || "Not added"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-[#6b6b6b]" />
          <span className="text-[#6b6b6b] text-xs font-lexend">
            {patient.age ? `${patient.age} years` : "Age unknown"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplet size={14} className="text-[#6b6b6b]" />
          <span className="text-[#6b6b6b] text-xs font-lexend">
            {patient.blood_group || "Blood type unknown"}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(51,65,85,0.3)] mb-4" />

      {/* Bottom row - conditions and date */}
      <div className="flex justify-between items-center">
        {getConditionTag()}
        {getLastSessionInfo()}
      </div>
    </div>
  );
}
