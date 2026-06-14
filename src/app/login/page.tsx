"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState, type ClipboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseFirstProfileClipboardBlock } from "@/lib/shared/profile-clipboard";
import { isPortalAccessSealed } from "@/lib/shared/portal-access-seal";
import { getPortalDeviceCredentials } from "@/lib/device-auth";
import { LayoutDashboard, Loader2, Lock } from "lucide-react";

const LOGIN_ERRORS: Record<string, string> = {
  portal_unavailable:
    "Tu sesión ya no es válida para el portal (cuenta borrada o revocada). Inicia sesión de nuevo.",
  cuenta_eliminada:
    "La cuenta ya no existe. Si era de un solo uso, entra solo desde el launcher de escritorio.",
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [portalAccessSealed, setPortalAccessSealed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [singleUseBlocked, setSingleUseBlocked] = useState(false);

  const hasSealedAccess = Boolean(portalAccessSealed);
  const canSubmit = Boolean(username.trim() && (password || hasSealedAccess) && !singleUseBlocked);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err && LOGIN_ERRORS[err]) {
      setError(LOGIN_ERRORS[err]);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d: { loggedIn?: boolean; reason?: string }) => {
        if (d.loggedIn) {
          router.replace("/dashboard");
          return;
        }
        if (d.reason && LOGIN_ERRORS[d.reason]) {
          setError(LOGIN_ERRORS[d.reason]);
        }
      })
      .finally(() => setChecking(false));
  }, [router]);

  const applyClipboardPayload = useCallback((text: string): boolean => {
    const parsed = parseFirstProfileClipboardBlock(text);
    if (!parsed) return false;

    setError(null);
    setSingleUseBlocked(false);

    if (parsed.nombre) setUsername(parsed.nombre);

    const sealed =
      parsed.acceso_portal?.trim() ||
      (parsed.contraseña && isPortalAccessSealed(parsed.contraseña) ? parsed.contraseña.trim() : null);

    if (sealed) {
      setPortalAccessSealed(sealed);
      setPassword("");
    } else if (parsed.contraseña?.trim()) {
      setPortalAccessSealed(null);
      setPassword(parsed.contraseña.trim());
    }

    const extras: string[] = [];
    if (parsed.plan) extras.push(parsed.plan);
    if (parsed.nombre_visible && parsed.nombre_visible !== parsed.nombre) {
      extras.push(parsed.nombre_visible);
    }

    if (sealed) {
      setPasteHint(
        `Importado: ${parsed.nombre ?? "—"}${extras.length ? ` · ${extras.join(" · ")}` : ""}. Contraseña cifrada cargada — pulsa «Entrar al portal».`
      );
    } else if (parsed.contraseña?.trim()) {
      setPasteHint(
        `Importado: ${parsed.nombre ?? "—"}${extras.length ? ` · ${extras.join(" · ")}` : ""}. Pulsa «Entrar al portal».`
      );
      if (/un solo uso/i.test(parsed.notas ?? "")) {
        setSingleUseBlocked(true);
        setError(
          "Este perfil es de un solo uso: solo funciona en el launcher de escritorio, no en Player Portal."
        );
      }
    } else if (parsed.nombre) {
      setPasteHint(
        `Usuario «${parsed.nombre}» importado${extras.length ? ` (${extras.join(" · ")})` : ""}. Falta acceso_portal — copia de nuevo desde Admin o resetea contraseña.`
      );
    } else {
      setPasteHint("Datos importados. Completa usuario y acceso.");
    }

    return true;
  }, []);

  function handlePaste(e: ClipboardEvent) {
    const text = e.clipboardData.getData("text/plain");
    if (!text.trim()) return;
    if (!applyClipboardPayload(text)) return;
    e.preventDefault();
  }

  function clearSealedAccess() {
    setPortalAccessSealed(null);
    setPassword("");
    setPasteHint(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const { deviceId, fingerprint } = await getPortalDeviceCredentials();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password: hasSealedAccess ? undefined : password,
          portalAccessSealed: portalAccessSealed ?? undefined,
          deviceId,
          fingerprint,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "No se pudo iniciar sesión");
        return;
      }
      setPortalAccessSealed(null);
      setPassword("");
      router.replace("/dashboard");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen portal-grid-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-portal-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen portal-grid-bg flex items-center justify-center p-4" onPasteCapture={handlePaste}>
      <div className="portal-card w-full max-w-md p-8 sm:p-9">
        <div className="flex items-center gap-3 mb-7">
          <div className="p-2.5 rounded-xl bg-portal-accent/12">
            <LayoutDashboard className="w-6 h-6 text-portal-accent-soft" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Player Portal</h1>
            <p className="text-sm text-portal-muted mt-0.5">Tu cuenta del launcher</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-portal-muted">Usuario</span>
            <input
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="portal-input px-4 py-2.5 text-sm"
            />
          </label>

          {hasSealedAccess ? (
            <div className="portal-stat px-4 py-3.5 flex items-start gap-3">
              <Lock className="w-4 h-4 text-portal-success shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-medium">Acceso cifrado listo</p>
                <p className="text-xs text-portal-muted mt-1 leading-relaxed">
                  La contraseña viaja cifrada y solo se usa en el servidor.
                </p>
                <button
                  type="button"
                  onClick={clearSealedAccess}
                  className="text-xs text-portal-accent-soft mt-2"
                >
                  Escribir contraseña manualmente
                </button>
              </div>
            </div>
          ) : (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-portal-muted">Contraseña</span>
              <input
                type="password"
                autoComplete="current-password"
                required={!hasSealedAccess}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="portal-input px-4 py-2.5 text-sm"
              />
            </label>
          )}

          {pasteHint && (
            <p className="text-sm portal-chip portal-chip--success px-3.5 py-2.5 leading-relaxed">{pasteHint}</p>
          )}

          {error && (
            <p className="text-sm portal-chip portal-chip--danger px-3.5 py-2.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="portal-btn portal-btn-primary w-full py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Entrar
          </button>
        </form>

        <p className="mt-7 text-[11px] text-center text-portal-muted leading-relaxed max-w-xs mx-auto">
          Pega el bloque copiado desde Admin → Perfiles en cualquier campo del formulario.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen portal-grid-bg flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-portal-accent" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
