import { NextResponse } from "next/server";
import { getAlertCounts } from "@/lib/services/alerts.service";

export async function GET() {
  try {
    const counts = await getAlertCounts();
    return NextResponse.json(counts, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api][alerts][summary] Failed to load alert counts", error);
    return NextResponse.json(
      {
        critical: 0,
        medium: 0,
        low: 0,
        acknowledged: 0,
        totalOpen: 0,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
