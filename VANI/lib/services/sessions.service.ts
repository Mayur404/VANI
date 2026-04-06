import { prisma } from "../prisma";

export interface PatientWithReports {
  id: number;
  name: string;
  phone_number: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  known_allergies: string | null;
  chronic_conditions: string | null;
  current_medications: string | null;
  past_surgeries: string | null;
  family_history: string | null;
  insurance_id: string | null;
  created_at: string;
  healthcare_reports?: {
    severity?: string | null;
  }[];
}

export interface Customer {
  id: number;
  name: string;
  phone_number: string | null;
  loan_account_number: string | null;
  outstanding_amount: number | null;
  due_date: string | null;
  created_at: string;
}

type PatientRecord = Omit<PatientWithReports, "healthcare_reports"> & {
  healthcare_reports: { severity?: string | null }[];
};

type CustomerRecord = Customer;

const serializePatient = (patient: PatientRecord): PatientWithReports => ({
  id: patient.id,
  name: patient.name,
  phone_number: patient.phone_number,
  age: patient.age,
  gender: patient.gender,
  blood_group: patient.blood_group,
  emergency_contact_name: patient.emergency_contact_name,
  emergency_contact_phone: patient.emergency_contact_phone,
  known_allergies: patient.known_allergies,
  chronic_conditions: patient.chronic_conditions,
  current_medications: patient.current_medications,
  past_surgeries: patient.past_surgeries,
  family_history: patient.family_history,
  insurance_id: patient.insurance_id,
  created_at: patient.created_at,
  healthcare_reports: patient.healthcare_reports?.map((report) => ({
    severity: report.severity,
  })) ?? [],
});

const serializeCustomer = (customer: CustomerRecord): Customer => ({
  id: customer.id,
  name: customer.name,
  phone_number: customer.phone_number,
  loan_account_number: customer.loan_account_number,
  outstanding_amount:
    customer.outstanding_amount === null || customer.outstanding_amount === undefined
      ? null
      : Number(customer.outstanding_amount),
  due_date: customer.due_date,
  created_at: customer.created_at,
});

export const getPatients = async (userId?: number): Promise<PatientWithReports[]> => {
  // TODO: Filter by userId when user association is implemented
  const patients = await prisma.patients.findMany({
    include: {
      healthcare_reports: {
        take: 1,
        orderBy: { created_at: "desc" },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return patients.map((patient) => serializePatient({
    id: patient.id,
    name: patient.name,
    phone_number: patient.phone_number,
    age: patient.age,
    gender: patient.gender,
    blood_group: patient.blood_group,
    emergency_contact_name: patient.emergency_contact_name,
    emergency_contact_phone: patient.emergency_contact_phone,
    known_allergies: patient.known_allergies,
    chronic_conditions: patient.chronic_conditions,
    current_medications: patient.current_medications,
    past_surgeries: patient.past_surgeries,
    family_history: patient.family_history,
    insurance_id: patient.insurance_id,
    created_at: patient.created_at?.toISOString() ?? new Date(0).toISOString(),
    healthcare_reports: patient.healthcare_reports.map((report) => ({
      severity: report.severity,
    })),
  }));
};

export const getCustomers = async (userId?: number): Promise<Customer[]> => {
  // TODO: Filter by userId when user association is implemented
  const customers = await prisma.customers.findMany({
    orderBy: { created_at: "desc" },
  });

  return customers.map((customer) => serializeCustomer({
    id: customer.id,
    name: customer.name,
    phone_number: customer.phone_number,
    loan_account_number: customer.loan_account_number,
    outstanding_amount:
      customer.outstanding_amount === null || customer.outstanding_amount === undefined
        ? null
        : Number(customer.outstanding_amount),
    due_date: customer.due_date?.toISOString() ?? null,
    created_at: customer.created_at?.toISOString() ?? new Date(0).toISOString(),
  }));
};

export const getPatientsCount = async (): Promise<number> => {
  return prisma.patients.count();
};

export const getCustomersCount = async (): Promise<number> => {
  return prisma.customers.count();
};

export const getActiveSessionsCount = async (domain: "healthcare" | "finance"): Promise<number> => {
  return prisma.sessions.count({
    where: {
      domain,
      status: "active",
    },
  });
};

export const getPendingReportsCount = async (): Promise<number> => {
  return prisma.sessions.count({
    where: {
      domain: "healthcare",
      status: "pending_review",
    },
  });
};

export const getCallsTodayCount = async (): Promise<number> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.scheduled_calls.count({
    where: {
      scheduled_time: {
        gte: today,
      },
    },
  });
};

export const getPendingFollowUpsCount = async (): Promise<number> => {
  return prisma.scheduled_calls.count({
    where: {
      status: "pending",
    },
  });
};

// Mock data for development when backend is not ready
export const getMockPatients = (): PatientWithReports[] => [
  {
    id: 1,
    name: "Ravi Kumar",
    phone_number: "+91 98765 43210",
    age: 45,
    gender: "male",
    blood_group: "O+",
    emergency_contact_name: "Sunita Kumar",
    emergency_contact_phone: "+91 98765 43211",
    known_allergies: '["Penicillin", "Dust"]',
    chronic_conditions: '["Diabetes", "Hypertension"]',
    current_medications: '["Metformin 500mg"]',
    past_surgeries: "[]",
    family_history: "Father had heart disease",
    insurance_id: "HDFC-INS-00123",
    created_at: new Date().toISOString(),
    healthcare_reports: [{ severity: "critical" }],
  },
  {
    id: 2,
    name: "Priya Sharma",
    phone_number: "+91 87654 32109",
    age: 32,
    gender: "female",
    blood_group: "A+",
    emergency_contact_name: "Amit Sharma",
    emergency_contact_phone: "+91 87654 32108",
    known_allergies: '["Peanuts"]',
    chronic_conditions: '["Asthma"]',
    current_medications: '["Albuterol inhaler"]',
    past_surgeries: '["Appendectomy 2019"]',
    family_history: "Mother has diabetes",
    insurance_id: "ICICI-INS-00456",
    created_at: new Date().toISOString(),
    healthcare_reports: [{ severity: "opd" }],
  },
  {
    id: 3,
    name: "Suresh Patel",
    phone_number: "+91 76543 21098",
    age: 58,
    gender: "male",
    blood_group: "B+",
    emergency_contact_name: "Kiran Patel",
    emergency_contact_phone: "+91 76543 21097",
    known_allergies: "null",
    chronic_conditions: '["Heart Disease", "High Cholesterol"]',
    current_medications: '["Atorvastatin", "Aspirin"]',
    past_surgeries: '["Angioplasty 2022"]',
    family_history: "Brother had stroke",
    insurance_id: "BAJAJ-INS-00789",
    created_at: new Date().toISOString(),
    healthcare_reports: [],
  },
];

export const getMockCustomers = (): Customer[] => [
  {
    id: 1,
    name: "Rajesh Gupta",
    phone_number: "+91 99887 76655",
    loan_account_number: "LOAN-HDC-00456",
    outstanding_amount: 45000,
    due_date: "2025-03-15",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Meena Reddy",
    phone_number: "+91 88776 65544",
    loan_account_number: "LOAN-SBI-00789",
    outstanding_amount: 120000,
    due_date: "2025-04-01",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Arun Kumar",
    phone_number: "+91 77665 54433",
    loan_account_number: "LOAN-ICICI-00123",
    outstanding_amount: 75000,
    due_date: "2025-02-28",
    created_at: new Date().toISOString(),
  },
];
