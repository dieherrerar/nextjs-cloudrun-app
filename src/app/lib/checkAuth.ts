import { cookies } from "next/headers";
import { verifyAuthToken } from "./auth";

export async function checkAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ecopulse_auth")?.value;

    if (!token) {
      return { valid: false, user: null };
    }

    const payload = await verifyAuthToken(token);

    return {
      valid: true,
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
    };
  } catch {
    return { valid: false, user: null };
  }
}
