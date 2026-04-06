import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CustomerResponse = {
  id: number;
  name: string;
  phone_number: string | null;
  loan_account_number: string | null;
  outstanding_amount: number | { toString(): string } | null;
  due_date: Date | null;
  created_at: Date | null;
};

const toPlainCustomer = (customer: CustomerResponse) => ({
  id: customer.id,
  name: customer.name,
  phone_number: customer.phone_number,
  loan_account_number: customer.loan_account_number,
  outstanding_amount:
    customer.outstanding_amount === null || customer.outstanding_amount === undefined
      ? null
      : Number(customer.outstanding_amount),
  due_date: customer.due_date?.toISOString() ?? null,
  created_at: customer.created_at?.toISOString() ?? null,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const customer = await prisma.customers.create({
      data: {
        name: body.name,
        phone_number: body.phone_number ?? null,
        loan_account_number: body.loan_account_number ?? null,
        outstanding_amount: body.outstanding_amount ?? null,
        due_date: body.due_date ? new Date(body.due_date) : null,
      },
    });

    return NextResponse.json(toPlainCustomer(customer), { status: 201 });
  } catch (error) {
    console.error("[customers][POST] Failed to create customer", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
