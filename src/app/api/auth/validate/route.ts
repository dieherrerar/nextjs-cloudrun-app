import { NextResponse } from "next/server";
import { verifyAuthToken } from "../../../lib/auth";

export async function GET(req: Request) {
  try {
    const token = (req as any).cookies.get("ecopulse_auth")?.value;
    if (!token) return NextResponse.json({ valid: false });
    const payload = await verifyAuthToken(token);
    return NextResponse.json({ valid: true, payload });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
