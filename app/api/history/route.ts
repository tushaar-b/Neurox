import { NextResponse } from "next/server";
import { getNotionConfig, queryNotionPlansByUserEmail } from "../../../lib/notion";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const config = getNotionConfig(request.headers);

    if (!config.apiKey || !config.plansDbId) {
      return NextResponse.json(
        { error: "Database configuration is incomplete" },
        { status: 500 }
      );
    }

    const plans = await queryNotionPlansByUserEmail(email, config);

    return NextResponse.json({
      success: true,
      plans
    });
  } catch (err: any) {
    console.error("History API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
