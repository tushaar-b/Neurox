import { NextResponse } from "next/server";
import { queryNotionUser, createNotionUser, hashPassword, getNotionConfig } from "../../../../lib/notion";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
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

    // Check if user already exists
    const existingUser = await queryNotionUser(email, config);
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    await createNotionUser(email, passwordHash, name, config);

    return NextResponse.json(
      { success: true, message: "User registered successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Signup API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
