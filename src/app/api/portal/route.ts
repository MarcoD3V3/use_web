import { NextResponse } from "next/server";
import { playerAuthHeaders, readPortalAuthCookies } from "@/lib/auth-cookies";
import { getAdminApiUrl, isAdminApiUrlMissingForDeploy } from "@/lib/server-config";

async function readUpstreamJson(upstream: Response): Promise<{ data: unknown; parseError?: string }> {
  const text = await upstream.text();
  if (!text.trim()) {
    return { data: {} };
  }
  try {
    return { data: JSON.parse(text) as unknown };
  } catch {
    return {
      data: null,
      parseError: upstream.ok
        ? "Respuesta inválida del admin"
        : `El admin respondió con HTML (¿está npm run dev en el puerto 3000?). Código ${upstream.status}`,
    };
  }
}

async function proxyPortal(method: "GET" | "POST", body?: unknown) {
  if (isAdminApiUrlMissingForDeploy()) {
    return NextResponse.json({ error: "ADMIN_API_URL no configurada" }, { status: 503 });
  }

  const auth = await readPortalAuthCookies();
  const headers = playerAuthHeaders(auth);
  if (!headers) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const adminUrl = getAdminApiUrl();
  try {
    const upstream = await fetch(`${adminUrl}/api/player-portal`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const { data, parseError } = await readUpstreamJson(upstream);
    if (parseError) {
      return NextResponse.json({ error: parseError }, { status: 502 });
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar al admin. ¿Está corriendo en localhost:3000?" },
      { status: 502 }
    );
  }
}

export async function GET() {
  return proxyPortal("GET");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  return proxyPortal("POST", body);
}
