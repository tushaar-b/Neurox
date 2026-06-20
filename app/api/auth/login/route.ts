import { NextResponse } from "next/server";
import { queryNotionUser, hashPassword, getNotionConfig } from "../../../../lib/notion";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const config = getNotionConfig(request.headers);

    if (!config.apiKey || !config.usersDbId) {
      return NextResponse.json(
        { error: "Database configuration is incomplete" },
        { status: 500 }
      );
    }

    const user = await queryNotionUser(email, config);

    if (!user) {
      return NextResponse.json(
        { error: "User not found or credentials invalid" },
        { status: 401 }
      );
    }

    const inputHash = hashPassword(password);

    if (user.passwordHash !== inputHash) {
      return NextResponse.json(
        { error: "User not found or credentials invalid" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        notionPageUrl: user.url,
      },
    });
  } catch (err: any) {
    console.error("Login API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
