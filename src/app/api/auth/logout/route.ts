import { NextResponse } from "next/server";
import { authCookieOptions } from "../../../../app/lib/auth";

export async function POST() {
  const { name, cookie } = authCookieOptions();

  const res = NextResponse.json({ success: true, message: "Sesión cerrada" });
  res.cookies.set(name, "", {
    ...cookie,
    maxAge: 0,
    expires: new Date(0),
  });

  return res;
}
