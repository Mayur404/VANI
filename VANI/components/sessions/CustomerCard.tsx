"use client";

import { Calendar, DollarSign, Info, Phone } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  phone_number: string | null;
  loan_account_number: string | null;
  outstanding_amount: number | null;
  due_date: string | null;
}

interface CustomerCardProps {
  customer: Customer;
  onClick: (customer: Customer) => void;
  onInfoClick: (customer: Customer) => void;
}

export function CustomerCard({ customer, onClick, onInfoClick }: CustomerCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "Unknown";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isOverdue = () => {
    if (!customer.due_date) return false;
    return new Date(customer.due_date) < new Date();
  };

  const getOverdueBadge = () => {
    if (isOverdue()) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
          Overdue
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
        On time
      </span>
    );
  };

  const getLastCallInfo = () => {
    // TODO: Replace with actual last call date when available
    return (
      <span className="text-xs text-[#6b6b6b] font-mono">No calls yet</span>
    );
  };

  return (
    <div
      onClick={() => onClick(customer)}
      className="bg-[#0a0a0a] border border-[rgba(51,65,85,0.4)] rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-[rgba(245,158,11,0.4)] hover:bg-[rgba(245,158,11,0.04)] hover:-translate-y-0.5"
    >
      {/* Top row - avatar and name */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] flex items-center justify-center">
            <span className="text-lg font-bold font-oxanium text-[#F59E0B]">
              {getInitials(customer.name)}
            </span>
          </div>
          {/* Name and account */}
          <div>
            <h3 className="text-white font-medium font-outfit text-sm">{customer.name}</h3>
            <p className="text-[#6b6b6b] text-xs font-mono">
              AC: {customer.loan_account_number || "Unknown"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onInfoClick(customer);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2c2c2c] bg-[#111111] text-[#9d9d9d] transition-colors hover:border-amber-500/40 hover:text-white"
          aria-label={`Open profile for ${customer.name}`}
        >
          <Info size={14} />
        </button>
      </div>

      {/* Middle row - info items */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <Phone size={14} className="text-[#6b6b6b]" />
          <span className="text-[#6b6b6b] text-xs font-lexend">
            {customer.phone_number || "Not added"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign size={14} className="text-[#6b6b6b]" />
          <span className="text-[#6b6b6b] text-xs font-lexend">
            {formatCurrency(customer.outstanding_amount)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-[#6b6b6b]" />
          <span className="text-[#6b6b6b] text-xs font-lexend">
            Due: {formatDate(customer.due_date)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(51,65,85,0.3)] mb-4" />

      {/* Bottom row - overdue status and last call */}
      <div className="flex justify-between items-center">
        {getOverdueBadge()}
        {getLastCallInfo()}
      </div>
    </div>
  );
}
