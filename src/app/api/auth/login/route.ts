import { NextResponse } from "next/server";
import { PORTAL_AUTH, authCookieBase } from "@/lib/auth-cookies";
import {
  isPortalClipboardSecretConfigured,
  resolvePortalLoginPassword,
} from "@/lib/portal-access-seal";
import { getAdminApiUrl, isAdminApiUrlMissingForDeploy } from "@/lib/server-config";

export async function POST(request: Request) {
  let body: {
    username?: string;
    password?: string;
    portalAccessSealed?: string;
    deviceId?: string;
    fingerprint?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ success: false, error: "Petición inválida" }, { status: 400 });
  }

  const username = body.username?.trim();
  const deviceId = body.deviceId?.trim();
  const fingerprint = body.fingerprint?.trim();

  if (!username || !deviceId || !fingerprint) {
    return NextResponse.json({ success: false, error: "Datos incompletos" }, { status: 400 });
  }

  if (body.portalAccessSealed && !isPortalClipboardSecretConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Falta PORTAL_CLIPBOARD_SECRET en user_web (misma clave que el admin).",
      },
      { status: 503 }
    );
  }

  const password = await resolvePortalLoginPassword({
    password: body.password,
    portalAccessSealed: body.portalAccessSealed,
  });

  if (!password) {
    return NextResponse.json(
      {
        success: false,
        error: body.portalAccessSealed
          ? "No se pudo descifrar acceso_portal. Comprueba PORTAL_CLIPBOARD_SECRET o resetea la contraseña en admin."
          : "Contraseña requerida",
      },
      { status: 400 }
    );
  }

  if (isAdminApiUrlMissingForDeploy()) {
    return NextResponse.json(
      {
        success: false,
        error: "Falta ADMIN_API_URL en Railway. Apunta al servicio admin principal.",
      },
      { status: 503 }
    );
  }

  const adminUrl = getAdminApiUrl();
  let upstream: Response;
  try {
    upstream = await fetch(`${adminUrl}/api/launcher-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, deviceId, fingerprint, portalLogin: true }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "No se pudo conectar al servidor de cuentas." },
      { status: 502 }
    );
  }

  const data = (await upstream.json()) as {
    success?: boolean;
    error?: string;
    sessionToken?: string;
    username?: string | null;
    tier?: string;
    premium?: boolean;
  };

  if (!upstream.ok || !data.success || !data.sessionToken) {
    return NextResponse.json(
      { success: false, error: data.error ?? "Usuario o contraseña incorrectos." },
      { status: upstream.status === 429 ? 429 : 401 }
    );
  }

  const cookieOpts = authCookieBase();
  const response = NextResponse.json({
    success: true,
    username: data.username ?? username,
    tier: data.tier ?? "free",
    premium: data.premium ?? false,
  });

  response.cookies.set(PORTAL_AUTH.session, data.sessionToken, cookieOpts);
  response.cookies.set(PORTAL_AUTH.deviceId, deviceId, cookieOpts);
  response.cookies.set(PORTAL_AUTH.fingerprint, fingerprint, cookieOpts);
  response.cookies.set(PORTAL_AUTH.username, data.username ?? username, {
    ...cookieOpts,
    httpOnly: false,
  });

  return response;
}
