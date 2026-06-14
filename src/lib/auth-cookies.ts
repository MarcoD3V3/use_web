import { cookies } from "next/headers";

export const PORTAL_AUTH = {
  session: "cl_portal_session",
  deviceId: "cl_portal_device",
  fingerprint: "cl_portal_fp",
  username: "cl_portal_user",
} as const;

const MAX_AGE = 90 * 24 * 3600;

export function authCookieBase() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}

export async function readPortalAuthCookies() {
  const jar = await cookies();
  return {
    sessionToken: jar.get(PORTAL_AUTH.session)?.value ?? null,
    deviceId: jar.get(PORTAL_AUTH.deviceId)?.value ?? null,
    fingerprint: jar.get(PORTAL_AUTH.fingerprint)?.value ?? null,
    username: jar.get(PORTAL_AUTH.username)?.value ?? null,
  };
}

export function playerAuthHeaders(auth: Awaited<ReturnType<typeof readPortalAuthCookies>>) {
  if (!auth.sessionToken || !auth.deviceId || !auth.fingerprint) return null;
  return {
    Authorization: `Bearer ${auth.sessionToken}`,
    "X-Device-Id": auth.deviceId,
    "X-Device-Fingerprint": auth.fingerprint,
    "Content-Type": "application/json",
  };
}
