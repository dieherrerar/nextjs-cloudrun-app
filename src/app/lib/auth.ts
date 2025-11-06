import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
const ISSUER = "ecopulse_auth";
const AUD = "ecopulse-app";

export type JWTPayload = {
  name: string;
  sub: string;
  email: string;
  role: string;
};

export async function signAuthToken(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUD)
    .setExpirationTime("2h")
    .sign(secret);
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    issuer: ISSUER,
    audience: AUD,
  });
  return payload as JWTPayload;
}

export function authCookieOptions() {
  return {
    name: ISSUER,
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 hours
    },
  };
}
