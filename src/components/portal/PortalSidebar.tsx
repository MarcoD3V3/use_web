"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CalendarDays,
  Gift,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Rocket,
  Settings,
  Shield,
  Sparkles,
  Target,
  User,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_NAV_ICONS: Record<string, LucideIcon> = {
  Cuenta: User,
  Recompensas: Gift,
  Misiones: Target,
  Launcher: Rocket,
  Perfil: UserCircle,
  Comunicación: Bell,
  Actividad: Activity,
  Social: MessageCircle,
  Personalización: Sparkles,
  Contenido: Package,
  Eventos: CalendarDays,
  Seguridad: Shield,
  Sistema: Settings,
};

type Props = {
  open: boolean;
  displayName: string;
  username: string;
  tierName?: string | null;
  premium?: boolean;
  points: number;
  activeCategory: string;
  categories: string[];
  sectionCount: number;
  categoryCounts: Record<string, number>;
  onSelectCategory: (category: string) => void;
  onLogout: () => void;
};

export function PortalSidebar({
  open,
  displayName,
  username,
  tierName,
  premium,
  points,
  activeCategory,
  categories,
  sectionCount,
  categoryCounts,
  onSelectCategory,
  onLogout,
}: Props) {
  const initial = (displayName || username || "?").charAt(0).toUpperCase();

  return (
    <aside
      className={cn(
        "portal-sidebar z-50 flex h-screen w-[16.5rem] shrink-0 flex-col",
        "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:h-screen",
        open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      )}
    >
      <div className="portal-sidebar__inner flex h-full flex-col">
        {/* Brand */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="portal-sidebar__logo flex h-9 w-9 items-center justify-center rounded-xl">
              <LayoutDashboard className="h-[18px] w-[18px] text-portal-accent-soft" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold tracking-tight text-white">Player Portal</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-portal-muted/80">CraftLauncher</p>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="px-4 pb-4">
          <div className="portal-sidebar__profile rounded-2xl p-3.5">
            <div className="flex items-center gap-3">
              <div className="portal-sidebar__avatar relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
                {initial}
                <span className="portal-sidebar__avatar-ring absolute inset-0 rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-[11px] text-portal-muted">@{username}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              {tierName && (
                <span className="portal-sidebar__pill text-[10px] font-medium text-portal-accent-soft">{tierName}</span>
              )}
              {premium && (
                <span className="portal-sidebar__pill portal-sidebar__pill--gold text-[10px] font-medium">Premium</span>
              )}
              <span className="ml-auto text-[10px] tabular-nums text-portal-muted">
                {points.toLocaleString("es")} pts
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="portal-sidebar__nav flex-1 overflow-y-auto px-3 pb-2">
          <p className="portal-sidebar__label px-3 pb-2">Navegación</p>
          <ul className="space-y-0.5">
            <SidebarNavItem
              active={activeCategory === "all"}
              onClick={() => onSelectCategory("all")}
              icon={<LayoutDashboard className="h-4 w-4" strokeWidth={1.75} />}
              label="Resumen"
              count={sectionCount}
            />
            {categories.map((cat) => {
              const Icon = CATEGORY_NAV_ICONS[cat] ?? LayoutDashboard;
              return (
                <SidebarNavItem
                  key={cat}
                  active={activeCategory === cat}
                  onClick={() => onSelectCategory(cat)}
                  icon={<Icon className="h-4 w-4" strokeWidth={1.75} />}
                  label={cat}
                  count={categoryCounts[cat] ?? 0}
                />
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2">
          <div className="portal-sidebar__footer-divider mb-3" />
          <button
            type="button"
            onClick={onLogout}
            className="portal-sidebar__logout group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-portal-muted"
          >
            <LogOut className="h-4 w-4 opacity-70" strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn("portal-sidebar__nav-item group relative w-full", active && "portal-sidebar__nav-item--active")}
      >
        <span className="portal-sidebar__nav-indicator" aria-hidden />
        <span className={cn("portal-sidebar__nav-icon", active && "text-portal-accent-soft")}>{icon}</span>
        <span className={cn("flex-1 truncate text-left text-[13px]", active ? "font-medium text-white" : "text-portal-muted group-hover:text-portal-text")}>
          {label}
        </span>
        <span
          className={cn(
            "min-w-[1.25rem] rounded-md px-1.5 py-0.5 text-center text-[10px] tabular-nums",
            active ? "bg-white/10 text-white/90" : "text-portal-muted/60"
          )}
        >
          {count}
        </span>
      </button>
    </li>
  );
}
