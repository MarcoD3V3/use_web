"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Gift,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  Target,
  User,
  X,
} from "lucide-react";
import { PortalSectionCard } from "@/components/PortalSectionCard";
import { PortalActivityHub } from "@/components/portal/PortalActivityHub";
import { PortalChatWidget } from "@/components/portal/PortalChatWidget";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { CATEGORY_ORDER, type PlayerPortalDashboard, type PortalSection } from "@/lib/portal-types";
import { cn } from "@/lib/utils";

type Props = {
  initialDashboard: PlayerPortalDashboard;
  username: string;
};

export function PortalShell({ initialDashboard, username }: Props) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [preferenceLoadingKey, setPreferenceLoadingKey] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const preferences = dashboard.preferences;
  const showCharts = preferences?.showCharts !== false;
  const compactMode = preferences?.compactMode === true;
  const activityEnabled = preferences?.activityFeedEnabled !== false;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal", { cache: "no-store" });
      const raw = await res.text();
      let data: { portal?: PlayerPortalDashboard; error?: string };
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        throw new Error("El servidor devolvió una respuesta inválida. Reinicia user-web:dev y comprueba que el admin esté en marcha.");
      }
      if (!res.ok || !data.portal) {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        throw new Error(data.error ?? "Error al cargar el portal");
      }
      setDashboard(data.portal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const categories = useMemo(() => {
    const set = new Set(dashboard.sections.map((s: PortalSection) => s.category));
    return CATEGORY_ORDER.filter((c: string) => set.has(c));
  }, [dashboard.sections]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of dashboard.sections) {
      counts[s.category] = (counts[s.category] ?? 0) + 1;
    }
    return counts;
  }, [dashboard.sections]);

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dashboard.sections.filter((s: PortalSection) => {
      if (activeCategory !== "all" && s.category !== activeCategory) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [dashboard.sections, activeCategory, search]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  async function handleRedeem(redeemableId: string) {
    setRedeemingId(redeemableId);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", redeemableId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; portal?: PlayerPortalDashboard };
      if (data.portal) setDashboard(data.portal);
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo canjear");
      }
    } catch {
      setError("Error de red al canjear");
    } finally {
      setRedeemingId(null);
    }
  }

  async function handlePreferenceChange(key: string, value: boolean) {
    setPreferenceLoadingKey(key);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_preference", key, value }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; portal?: PlayerPortalDashboard };
      if (data.portal) setDashboard(data.portal);
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo guardar la preferencia");
      }
    } catch {
      setError("Error de red al guardar preferencia");
    } finally {
      setPreferenceLoadingKey(null);
    }
  }

  function scrollContentToTop() {
    mainRef.current?.scrollTo({ top: 0 });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
    }
  }

  function selectCategory(cat: string) {
    setActiveCategory(cat);
    setSearch("");
    setSidebarOpen(false);
    requestAnimationFrame(scrollContentToTop);
  }

  function navigateToSection(sectionId: string) {
    const target = dashboard.sections.find((s) => s.id === sectionId);
    if (target) {
      setActiveCategory(target.category);
      setSearch("");
      setSidebarOpen(false);
      requestAnimationFrame(scrollContentToTop);
    }
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ block: "start" });
    });
  }

  useEffect(() => {
    scrollContentToTop();
  }, [activeCategory, search]);

  const stats = dashboard.stats;
  const pageTitle = activeCategory === "all" ? "Resumen" : activeCategory;
  const isOverview = activeCategory === "all";

  return (
    <div className="portal-shell h-screen portal-grid-bg flex overflow-hidden">
      <PortalSidebar
        open={sidebarOpen}
        displayName={dashboard.player.displayName}
        username={username}
        tierName={stats.tierName}
        premium={dashboard.player.premium}
        points={stats.points}
        activeCategory={activeCategory}
        categories={categories}
        sectionCount={dashboard.sections.length}
        categoryCounts={categoryCounts}
        onSelectCategory={selectCategory}
        onLogout={logout}
      />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 z-20 bg-portal-bg px-4 py-3 flex items-center gap-3 border-b border-white/[0.04]">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-white/5"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-muted pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="portal-input pl-10 pr-4 py-2.5 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="p-2.5 rounded-xl hover:bg-white/5 disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={cn("w-[18px] h-[18px] text-portal-muted", loading && "animate-spin")} />
          </button>
        </header>

        <main
          ref={mainRef}
          className="portal-shell__main flex-1 min-h-0 px-4 py-5 lg:px-8 lg:py-7 overflow-y-auto max-w-[1400px] w-full mx-auto"
        >
          {error && (
            <div className="mb-5 flex items-center gap-2 p-3.5 rounded-xl portal-chip portal-chip--danger text-sm">
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError(null)} className="opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isOverview && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3 mb-8">
              <StatCard icon={<Gift className="w-4 h-4" />} label="Puntos" value={stats.points.toLocaleString("es")} />
              <StatCard icon={<Target className="w-4 h-4" />} label="Rango" value={stats.tierName ?? dashboard.player.tier} />
              <StatCard icon={<Bell className="w-4 h-4" />} label="Avisos" value={String(stats.unreadNotifications)} />
              <StatCard icon={<Target className="w-4 h-4" />} label="Misiones" value={String(stats.activeMissions)} />
              <StatCard icon={<User className="w-4 h-4" />} label="Online" value={String(stats.devicesOnline)} />
              <StatCard icon={<LayoutDashboard className="w-4 h-4" />} label="Bloques" value={String(stats.totalSections)} />
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">{pageTitle}</h1>
              <p className="text-sm text-portal-muted mt-1">
                {isOverview ? "Vista general" : `Apartado · ${pageTitle}`}
                <span className="opacity-40 mx-1.5">·</span>
                {filteredSections.length} {filteredSections.length === 1 ? "sección" : "secciones"}
                <span className="opacity-40 mx-1.5">·</span>
                {new Date(dashboard.generatedAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {dashboard.player.premium && (
              <span className="portal-chip portal-chip--premium px-3 py-1">Premium</span>
            )}
          </div>

          <div
            key={activeCategory}
            className={cn("grid gap-3 sm:gap-4 lg:grid-cols-2", compactMode && "gap-2 sm:gap-3")}
          >
            {isOverview && (dashboard.activityFeed?.length ?? 0) > 0 && (
              <PortalActivityHub
                items={dashboard.activityFeed ?? []}
                enabled={activityEnabled}
                onNavigate={navigateToSection}
              />
            )}

            {filteredSections.map((section: PortalSection) => (
              <PortalSectionCard
                key={section.id}
                section={section}
                showCharts={showCharts}
                compact={compactMode}
                onNavigate={navigateToSection}
                onPreferenceChange={handlePreferenceChange}
                preferenceLoadingKey={preferenceLoadingKey}
                onRedeem={section.id === "rewards-shop" ? handleRedeem : undefined}
                redeemingId={redeemingId}
              />
            ))}
          </div>

          {filteredSections.length === 0 && (
            <p className="text-center text-portal-muted py-16 text-sm">
              No hay resultados. Prueba otra búsqueda o categoría.
            </p>
          )}
        </main>
      </div>

      <PortalChatWidget />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="portal-stat p-3.5 sm:p-4">
      <div className="flex items-center gap-1.5 text-portal-muted text-[11px] font-medium mb-2">
        {icon}
        {label}
      </div>
      <p className="text-xl font-semibold text-white truncate tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
