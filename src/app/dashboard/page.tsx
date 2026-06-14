import { redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { PORTAL_AUTH, playerAuthHeaders, readPortalAuthCookies } from "@/lib/auth-cookies";
import { getAdminApiUrl } from "@/lib/server-config";
import type { PlayerPortalDashboard } from "@/lib/portal-types";
import { cookies } from "next/headers";

async function clearPortalAuthCookies() {
  const jar = await cookies();
  for (const name of Object.values(PORTAL_AUTH) as string[]) {
    jar.delete(name);
  }
}

async function fetchPortal(): Promise<PlayerPortalDashboard | null> {
  const auth = await readPortalAuthCookies();
  const headers = playerAuthHeaders(auth);
  if (!headers) return null;

  const adminUrl = getAdminApiUrl();
  try {
    const res = await fetch(`${adminUrl}/api/player-portal`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { portal?: PlayerPortalDashboard };
    return data.portal ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const auth = await readPortalAuthCookies();
  if (!auth.sessionToken) redirect("/login");

  const portal = await fetchPortal();
  if (!portal) {
    await clearPortalAuthCookies();
    redirect("/login?error=portal_unavailable");
  }

  return (
    <PortalShell initialDashboard={portal} username={auth.username ?? portal.player.username} />
  );
}
