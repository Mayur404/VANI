"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface AddNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: "healthcare" | "finance";
  onAdd: (newItem: AddedEntity) => void;
}

type AddedEntity =
  | {
      id: number;
      name: string;
      phone_number: string | null;
      age: number | null;
      blood_group: string | null;
      insurance_id: string | null;
      chronic_conditions: string | null;
      healthcare_reports: Array<{ severity?: string | null }>;
    }
  | {
      id: number;
      name: string;
      phone_number: string | null;
      loan_account_number: string | null;
      outstanding_amount: number | null;
      due_date: string | null;
    };

interface FormData {
  // Common fields
  name: string;
  phone: string;

  // Healthcare only
  age: string;
  gender: string;
  bloodGroup: string;
  emergencyName: string;
  emergencyPhone: string;
  allergies: string;
  conditions: string;
  insurance: string;
  familyHistory: string;

  // Finance only
  loanAccountNumber: string;
  outstandingAmount: string;
  dueDate: string;
}

const initialFormData: FormData = {
  name: "",
  phone: "",
  age: "",
  gender: "",
  bloodGroup: "",
  emergencyName: "",
  emergencyPhone: "",
  allergies: "",
  conditions: "",
  insurance: "",
  familyHistory: "",
  loanAccountNumber: "",
  outstandingAmount: "",
  dueDate: "",
};

export function AddNewModal({ isOpen, onClose, domain, onAdd }: AddNewModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const apiBase = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    setSubmitError(null);
    onClose();
  }, [onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateHealthcare = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) <= 0)) {
      newErrors.age = "Must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFinance = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.loanAccountNumber.trim()) {
      newErrors.loanAccountNumber = "Loan account number is required";
    }

    if (
      formData.outstandingAmount &&
      (isNaN(Number(formData.outstandingAmount)) || Number(formData.outstandingAmount) <= 0)
    ) {
      newErrors.outstandingAmount = "Must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPatient = async () => {
    if (!validateHealthcare()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${apiBase}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone_number: formData.phone || null,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          blood_group: formData.bloodGroup || null,
          emergency_contact_name: formData.emergencyName || null,
          emergency_contact_phone: formData.emergencyPhone || null,
          known_allergies: formData.allergies
            ? JSON.stringify(formData.allergies.split(",").map((s) => s.trim()))
            : null,
          chronic_conditions: formData.conditions
            ? JSON.stringify(formData.conditions.split(",").map((s) => s.trim()))
            : null,
          insurance_id: formData.insurance || null,
          family_history: formData.familyHistory || null,
        }),
      });

      if (response.ok) {
        const newPatient = await response.json();
        onAdd(newPatient);
        showToast("success", "Patient added successfully");
        handleClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSubmitError(errorData.error || "Failed to add patient. Try again.");
      }
    } catch (error) {
      console.error("Failed to add patient:", error);
      setSubmitError("Failed to add patient. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!validateFinance()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${apiBase}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone_number: formData.phone || null,
          loan_account_number: formData.loanAccountNumber,
          outstanding_amount: formData.outstandingAmount
            ? parseFloat(formData.outstandingAmount)
            : null,
          due_date: formData.dueDate || null,
        }),
      });

      if (response.ok) {
        const newCustomer = await response.json();
        onAdd(newCustomer);
        showToast("success", "Customer added successfully");
        handleClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSubmitError(errorData.error || "Failed to add customer. Try again.");
      }
    } catch (error) {
      console.error("Failed to add customer:", error);
      setSubmitError("Failed to add customer. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (domain === "healthcare") {
      handleAddPatient();
    } else {
      handleAddCustomer();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#0f0e10] border border-[rgba(51,65,85,0.6)] rounded-2xl p-8 max-w-[720px] w-[90%] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#9d9d9d] hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-white font-bold font-oxanium text-2xl">
            {domain === "healthcare" ? "Add New Patient" : "Add New Customer"}
          </h2>
          <p className="text-[#6b6b6b] text-sm font-lexend mt-1">
            Basic information to get started
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          {domain === "healthcare" ? (
            <>
              {/* Row 1 - Name and Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Ravi Kumar"
                    className={cn(
                      "w-full bg-[rgba(15,23,42,0.8)] border rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none transition-colors",
                      errors.name
                        ? "border-[rgba(239,68,68,0.5)] focus:border-red-500"
                        : "border-[rgba(51,65,85,0.5)] focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)]"
                    )}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-[11px] font-lexend mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={cn(
                      "w-full bg-[rgba(15,23,42,0.8)] border rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none transition-colors",
                      errors.phone
                        ? "border-[rgba(239,68,68,0.5)] focus:border-red-500"
                        : "border-[rgba(51,65,85,0.5)] focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)]"
                    )}
                  />
                </div>
              </div>

              {/* Row 2 - Age, Gender, Blood Group */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    placeholder="45"
                    className={cn(
                      "w-full bg-[rgba(15,23,42,0.8)] border rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none transition-colors",
                      errors.age
                        ? "border-[rgba(239,68,68,0.5)] focus:border-red-500"
                        : "border-[rgba(51,65,85,0.5)] focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)]"
                    )}
                  />
                  {errors.age && (
                    <p className="text-red-400 text-[11px] font-lexend mt-1">{errors.age}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="w-full bg-[rgba(15,23,42,0.8)] border border-[rgba(51,65,85,0.5)] rounded-lg px-4 py-2.5 text-white font-lexend text-sm outline-none focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)] transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => handleChange("bloodGroup", e.target.value)}
                    className="w-full bg-[rgba(15,23,42,0.8)] border border-[rgba(51,65,85,0.5)] rounded-lg px-4 py-2.5 text-white font-lexend text-sm outline-none focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)] transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* Row 3 - Emergency Contacts */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) => handleChange("emergencyName", e.target.value)}
                    placeholder="Spouse / Parent name"
                    className="w-full bg-[rgba(15,23,42,0.8)] border border-[rgba(51,65,85,0.5)] rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleChange("emergencyPhone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[rgba(15,23,42,0.8)] border border-[rgba(51,65,85,0.5)] rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)] transition-colors"
                  />
                </div>
              </div>

              {/* Row 4 - Allergies */}
              <div>
                <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                  Known Allergies
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => handleChange("allergies", e.target.value)}
                  placeholder="Penicillin, dust... (comma separated)"
                  className="w-full bg-[rgba(15,23,42,0.8)] border border-[rgba(51,65,85,0.5)] rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)] transition-colors"
                />
                <p className="text-[#6b6b6b] text-[11px] font-lexend mt-1">
                  Separate multiple with commas
                </p>
              </div>

              {/* Row 5 - Chronic Conditions */}
              <div>
                <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                  Chronic Conditions
                </label>
                <input
                  type="text"
                  value={formData.conditions}
                  onChange={(e) => handleChange("conditions", e.target.value)}
                  placeholder="Diabetes, Hypertension..."
                  className="w-full bg-[rgba(15,23,42,0.8)] border border-[rgba(51,65,85,0.5)] rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)] transition-colors"
                />
              </div>

              {/* Row 6 - Insurance and Family History */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Insurance ID
                  </label>
                  <input
                    type="text"
                    value={formData.insurance}
                    onChange={(e) => handleChange("insurance", e.target.value)}
                    placeholder="HDFC-INS-00123"
                    className="w-full bg-[rgba(15,23,42,0.8)] border border-[rgba(51,65,85,0.5)] rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Family History
                  </label>
                  <textarea
                    value={formData.familyHistory}
                    onChange={(e) => handleChange("familyHistory", e.target.value)}
                    placeholder="Relevant family medical history"
                    rows={2}
                    className="w-full bg-[rgba(15,23,42,0.8)] border border-[rgba(51,65,85,0.5)] rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)] transition-colors resize-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Finance Form */}
              {/* Row 1 - Name and Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Rajesh Sharma"
                    className={cn(
                      "w-full bg-[rgba(15,23,42,0.8)] border rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none transition-colors",
                      errors.name
                        ? "border-[rgba(239,68,68,0.5)] focus:border-red-500"
                        : "border-[rgba(51,65,85,0.5)] focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)]"
                    )}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-[11px] font-lexend mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={cn(
                      "w-full bg-[rgba(15,23,42,0.8)] border rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none transition-colors",
                      errors.phone
                        ? "border-[rgba(239,68,68,0.5)] focus:border-red-500"
                        : "border-[rgba(51,65,85,0.5)] focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)]"
                    )}
                  />
                </div>
              </div>

              {/* Row 2 - Loan Account and Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Loan Account Number *
                  </label>
                  <input
                    type="text"
                    value={formData.loanAccountNumber}
                    onChange={(e) => handleChange("loanAccountNumber", e.target.value)}
                    placeholder="LOAN-HDC-00456"
                    className={cn(
                      "w-full bg-[rgba(15,23,42,0.8)] border rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none transition-colors",
                      errors.loanAccountNumber
                        ? "border-[rgba(239,68,68,0.5)] focus:border-red-500"
                        : "border-[rgba(51,65,85,0.5)] focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)]"
                    )}
                  />
                  {errors.loanAccountNumber && (
                    <p className="text-red-400 text-[11px] font-lexend mt-1">
                      {errors.loanAccountNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                    Outstanding Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.outstandingAmount}
                    onChange={(e) => handleChange("outstandingAmount", e.target.value)}
                    placeholder="45000"
                    className={cn(
                      "w-full bg-[rgba(15,23,42,0.8)] border rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none transition-colors",
                      errors.outstandingAmount
                        ? "border-[rgba(239,68,68,0.5)] focus:border-red-500"
                        : "border-[rgba(51,65,85,0.5)] focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)]"
                    )}
                  />
                  {errors.outstandingAmount && (
                    <p className="text-red-400 text-[11px] font-lexend mt-1">
                      {errors.outstandingAmount}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3 - Due Date */}
              <div>
                <label className="block text-[#6b6b6b] text-xs font-mono uppercase mb-2">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                  className="w-full bg-[rgba(15,23,42,0.8)] border border-[rgba(51,65,85,0.5)] rounded-lg px-4 py-2.5 text-white font-lexend text-sm placeholder-[#334155] outline-none focus:border-[rgba(59,130,246,0.6)] focus:ring-3 focus:ring-[rgba(59,130,246,0.1)] transition-colors"
                />
              </div>
            </>
          )}

          {/* Submit error */}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm font-lexend">{submitError}</p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 py-3 bg-[#1a1a1a] hover:bg-[#2c2c2c] text-white border border-[#2c2c2c] rounded-xl font-outfit font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "flex-1 py-3 rounded-xl font-outfit font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
              submitting
                ? "bg-[#1f1f1f] text-[#6b6b6b]"
                : "bg-[#2b7fff] text-white hover:bg-[#1e66d4] hover:scale-[1.02]"
            )}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Adding...
              </span>
            ) : domain === "healthcare" ? (
              "Add Patient"
            ) : (
              "Add Customer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
