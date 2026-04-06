"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  Search,
  X,
  UserPlus,
  Briefcase,
} from "lucide-react";
import useRecordingStore from "@/store/useRecordingStore";
import { PatientCard } from "@/components/sessions/PatientCard";
import { CustomerCard } from "@/components/sessions/CustomerCard";
import { SkeletonCard } from "@/components/sessions/SkeletonCard";
import { SessionActionModal } from "@/components/sessions/SessionActionModal";
import { AddNewModal } from "@/components/sessions/AddNewModal";

interface Patient {
  id: number;
  name: string;
  phone_number: string | null;
  age: number | null;
  blood_group: string | null;
  insurance_id: string | null;
  chronic_conditions: string | null;
  healthcare_reports?: {
    severity?: string | null;
  }[];
}

interface Customer {
  id: number;
  name: string;
  phone_number: string | null;
  loan_account_number: string | null;
  outstanding_amount: number | null;
  due_date: string | null;
}

interface SessionsPageClientProps {
  domain: "healthcare" | "finance";
  initialPatients: Patient[];
  initialCustomers: Customer[];
  stats: {
    total: number;
    activeSessions: number;
    pendingReports: number;
  };
}

type HealthcareFilter = "All" | "Critical" | "OPD" | "Follow-up" | "New";
type FinanceFilter = "All" | "Overdue" | "Paid" | "Promised" | "In Progress";
type AddedEntity = Patient | Customer;

export default function SessionsPageClient({
  domain: initialDomain,
  initialPatients,
  initialCustomers,
  stats: initialStats,
}: SessionsPageClientProps) {
  const router = useRouter();
  const setSelectedDomain = useRecordingStore((state) => state.setSelectedDomain);

  // State
  const [loading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<HealthcareFilter | FinanceFilter | string>("All");
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string } | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [stats, setStats] = useState(initialStats);

  // Set domain on mount and sync to Zustand store
  useEffect(() => {
    setSelectedDomain(initialDomain);
  }, [initialDomain, setSelectedDomain]);

  // Check if domain is still null (user navigated directly without selection)
  const storedDomain = useRecordingStore((state) => state.selectedDomain);
  useEffect(() => {
    if (storedDomain === null && initialDomain) {
      // Domain was passed but not in store - this is fine, already set above
    } else if (storedDomain === null && !initialDomain) {
      // No domain at all, redirect to home
      router.push("/home");
    }
  }, [storedDomain, initialDomain, router]);

  // Filter data based on search and filter
  const filteredData = useMemo(() => {
    const data = initialDomain === "healthcare" ? patients : customers;

    return data.filter((item) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();

      if (initialDomain === "healthcare") {
        const patient = item as Patient;
        const matchesSearch =
          patient.name.toLowerCase().includes(searchLower) ||
          (patient.phone_number && patient.phone_number.includes(searchLower)) ||
          (patient.insurance_id && patient.insurance_id.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;

        // Category filter
        if (activeFilter === "All") return true;

        const filter = activeFilter as HealthcareFilter;
        if (filter === "Critical") {
          return patient.healthcare_reports?.[0]?.severity === "critical";
        }
        if (filter === "OPD") {
          return patient.healthcare_reports?.[0]?.severity === "opd";
        }
        if (filter === "New") {
          return !patient.healthcare_reports || patient.healthcare_reports.length === 0;
        }
        if (filter === "Follow-up") {
          return patient.chronic_conditions && JSON.parse(patient.chronic_conditions || "[]").length > 0;
        }
      } else {
        const customer = item as Customer;
        const matchesSearch =
          customer.name.toLowerCase().includes(searchLower) ||
          (customer.phone_number && customer.phone_number.includes(searchLower)) ||
          (customer.loan_account_number && customer.loan_account_number.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;

        // Category filter
        if (activeFilter === "All") return true;

        const filter = activeFilter as FinanceFilter;
        if (filter === "Overdue") {
          return customer.due_date && new Date(customer.due_date) < new Date();
        }
        if (filter === "Paid") {
          return customer.outstanding_amount === 0;
        }
        if (filter === "Promised") {
          return false;
        }
        if (filter === "In Progress") {
          return customer.outstanding_amount !== null && customer.outstanding_amount > 0;
        }
      }

      return true;
    });
  }, [patients, customers, initialDomain, searchQuery, activeFilter]);

  const handleCardClick = (item: Patient | Customer) => {
    setSelectedPatient({ id: item.id, name: item.name });
    setActionModalOpen(true);
  };

  const handleInfoClick = (item: Patient | Customer) => {
    const domain = initialDomain === "healthcare" ? "healthcare" : "finance";
    router.push(`/userprofile?domain=${domain}&id=${item.id}`);
  };

  const handleAddNew = (newItem: AddedEntity) => {
    if (initialDomain === "healthcare") {
      setPatients((prev) => [newItem, ...prev]);
    } else {
      setCustomers((prev) => [newItem, ...prev]);
    }
    setStats((prev) => ({ ...prev, total: prev.total + 1 }));
  };

  const isHealthcare = initialDomain === "healthcare";

  return (
    <div className="h-[95vh] w-full flex flex-col bg-black font-lexend overflow-y-auto">
      <div className="h-full w-full flex flex-col items-center p-4">
        {/* Page Header */}
        <div className="w-full flex items-start justify-between mb-4">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/home")}
              className="w-fit p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              <ChevronLeft size={24} className="text-[#9d9d9d]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white font-oxanium">
                {isHealthcare ? "Your Patients" : "Your Customers"}
              </h1>
              <p className="text-sm text-[#9d9d9d] font-lexend mt-1">
                {isHealthcare
                  ? "Select a patient to begin a new recording session"
                  : "Select a customer to initiate a call"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Domain Badge */}
            <span
              className={`px-4 py-2 rounded-full text-sm font-outfit font-semibold ${
                isHealthcare
                  ? "bg-teal-500/20 border-teal-500/30 text-teal-400"
                  : "bg-amber-500/20 border-amber-500/30 text-amber-400"
              }`}
            >
              {isHealthcare ? "Healthcare" : "Finance"}
            </span>

            {/* Add New Button */}
            <button
              onClick={() => setAddModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-outfit font-semibold transition-all duration-200 ${
                isHealthcare
                  ? "bg-teal-500/20 border border-teal-500/30 text-teal-400 hover:bg-teal-500/30"
                  : "bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
              }`}
            >
              <Plus size={18} />
              {isHealthcare ? "Add Patient" : "Add Customer"}
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="w-full grid grid-cols-3 gap-4 mb-4">
          <div className="bg-[#0f0e10] rounded-xl p-4 border border-[#1f1f1f]">
            <div className="text-3xl font-bold text-white font-oxanium">{stats.total}</div>
            <div className="text-xs text-[#9d9d9d] font-mono uppercase mt-1">
              Total {isHealthcare ? "Patients" : "Customers"}
            </div>
          </div>
          <div className="bg-[#0f0e10] rounded-xl p-4 border border-[#1f1f1f]">
            <div className="text-3xl font-bold text-white font-oxanium">{stats.activeSessions}</div>
            <div className="text-xs text-[#9d9d9d] font-mono uppercase mt-1">
              {isHealthcare ? "Active Sessions" : "Calls Today"}
            </div>
          </div>
          <div className="bg-[#0f0e10] rounded-xl p-4 border border-[#1f1f1f]">
            <div className="text-3xl font-bold text-white font-oxanium">{stats.pendingReports}</div>
            <div className="text-xs text-[#9d9d9d] font-mono uppercase mt-1">
              {isHealthcare ? "Pending Reports" : "Pending Follow-ups"}
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="w-full flex flex-col gap-3 mb-4">
          {/* Search Input */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isHealthcare
                  ? "Search patients by name, phone or ID..."
                  : "Search customers by name, loan account or phone..."
              }
              className="w-full bg-[#0f0e10] border border-[#1f1f1f] rounded-xl pl-12 pr-12 py-3 text-white font-lexend text-sm placeholder-[#6b6b6b] outline-none focus:border-[#2c2c2c] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {(
              isHealthcare
                ? ["All", "Critical", "OPD", "Follow-up", "New"]
                : ["All", "Overdue", "Paid", "Promised", "In Progress"]
            ).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeFilter === filter
                    ? isHealthcare
                      ? "bg-teal-500 text-white"
                      : "bg-amber-500 text-white"
                    : "bg-[#0f0e10] text-[#9d9d9d] border border-[#1f1f1f] hover:border-[#2c2c2c]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="w-full flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            /* Empty State */
            <div className="w-full flex items-center justify-center py-16">
              <div className="bg-[#0f0e10] border border-[#1f1f1f] rounded-2xl p-12 text-center max-w-md">
                {isHealthcare ? (
                  <UserPlus size={64} className="text-[#6b6b6b] mx-auto mb-4" />
                ) : (
                  <Briefcase size={64} className="text-[#6b6b6b] mx-auto mb-4" />
                )}
                <h2 className="text-white font-bold font-oxanium text-xl mb-2">
                  {isHealthcare ? "No patients yet" : "No customers yet"}
                </h2>
                <p className="text-[#6b6b6b] text-sm font-lexend mb-6">
                  {isHealthcare
                    ? "Add your first patient to start recording and documenting consultations"
                    : "Add your first customer to start managing loan recovery calls"}
                </p>
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="w-full py-3 bg-[#2b7fff] hover:bg-[#1e66d4] text-white rounded-xl font-outfit font-semibold transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  {isHealthcare ? "Add Patient" : "Add Customer"}
                </button>
              </div>
            </div>
          ) : (
            /* Patient/Customer Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.map((item) =>
                isHealthcare ? (
                  <PatientCard
                    key={item.id}
                    patient={item as Patient}
                    onClick={handleCardClick}
                    onInfoClick={handleInfoClick}
                  />
                ) : (
                  <CustomerCard
                    key={item.id}
                    customer={item as Customer}
                    onClick={handleCardClick}
                    onInfoClick={handleInfoClick}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Session Action Modal */}
      {selectedPatient && (
        <SessionActionModal
          isOpen={actionModalOpen}
          onClose={() => {
            setActionModalOpen(false);
            setSelectedPatient(null);
          }}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          domain={initialDomain}
        />
      )}

      {/* Add New Modal */}
      <AddNewModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        domain={initialDomain}
        onAdd={handleAddNew}
      />
    </div>
  );
}
