"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function selectDomain(domain: "healthcare" | "finance") {
  const cookieStore = await cookies();
  cookieStore.set("selected_domain", domain, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  redirect("/sessions");
}
