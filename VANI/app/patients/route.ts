import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PatientResponse = {
  id: number;
  name: string;
  phone_number: string | null;
  age: number | null;
  gender: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_group: string | null;
  known_allergies: string | null;
  chronic_conditions: string | null;
  current_medications: string | null;
  past_surgeries: string | null;
  family_history: string | null;
  insurance_id: string | null;
  created_at: Date | null;
  healthcare_reports: Array<{ severity?: string | null }>;
};

const toPlainPatient = (patient: PatientResponse) => ({
  id: patient.id,
  name: patient.name,
  phone_number: patient.phone_number,
  age: patient.age,
  gender: patient.gender,
  emergency_contact_name: patient.emergency_contact_name,
  emergency_contact_phone: patient.emergency_contact_phone,
  blood_group: patient.blood_group,
  known_allergies: patient.known_allergies,
  chronic_conditions: patient.chronic_conditions,
  current_medications: patient.current_medications,
  past_surgeries: patient.past_surgeries,
  family_history: patient.family_history,
  insurance_id: patient.insurance_id,
  created_at: patient.created_at?.toISOString() ?? null,
  healthcare_reports: [],
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const patient = await prisma.patients.create({
      data: {
        name: body.name,
        phone_number: body.phone_number ?? null,
        age: body.age ?? null,
        gender: body.gender ?? null,
        emergency_contact_name: body.emergency_contact_name ?? null,
        emergency_contact_phone: body.emergency_contact_phone ?? null,
        blood_group: body.blood_group ?? null,
        known_allergies: body.known_allergies ?? null,
        chronic_conditions: body.chronic_conditions ?? null,
        insurance_id: body.insurance_id ?? null,
        family_history: body.family_history ?? null,
      },
    });

    return NextResponse.json(toPlainPatient(patient), { status: 201 });
  } catch (error) {
    console.error("[patients][POST] Failed to create patient", error);
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}
