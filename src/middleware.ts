import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken } from "./app/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin") return NextResponse.next();

  if (pathname.startsWith("/admin/")) {
    const token = req.cookies.get("ecopulse_auth")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    try {
      const payload = await verifyAuthToken(token);
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
