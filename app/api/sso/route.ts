import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const secret = process.env.SSO_SECRET_KEY;
    if (!secret) {
      console.error("SSO_SECRET_KEY is not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Create a token that expires in 5 minutes
    const token = jwt.sign({ email }, secret, { expiresIn: "5m" });

    // We can also allow the client to pass the target URL or we just return the token
    return NextResponse.json({ token });
  } catch (error) {
    console.error("SSO Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate SSO token" }, { status: 500 });
  }
}
