"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowDownLeft, ArrowUpRight, Gift, Shield, Target, Wifi } from "lucide-react";
import type { PortalActivityItem } from "@/lib/portal-types";
import { cn, formatRelativeTime } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "Todo" },
  { id: "transaction", label: "Puntos" },
  { id: "mission", label: "Misiones" },
  { id: "redemption", label: "Canjes" },
  { id: "audit", label: "Seguridad" },
  { id: "session", label: "Sesiones" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function iconFor(type: PortalActivityItem["type"]) {
  switch (type) {
    case "transaction":
      return ArrowUpRight;
    case "redemption":
      return Gift;
    case "mission":
      return Target;
    case "audit":
      return Shield;
    case "session":
      return Wifi;
    default:
      return Activity;
  }
}

type Props = {
  items: PortalActivityItem[];
  enabled?: boolean;
  onNavigate?: (sectionId: string) => void;
};

export function PortalActivityHub({ items, enabled = true, onNavigate }: Props) {
  const [filter, setFilter] = useState<FilterId>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  if (!enabled) {
    return (
      <section className="portal-card p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-portal-muted" />
          <div>
            <h2 className="text-base font-semibold text-white">Línea de actividad</h2>
            <p className="text-sm text-portal-muted mt-0.5">
              Desactivada. Actívala en Centro de control → Feed de actividad.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="portal-card p-5 sm:p-6 mb-6 lg:col-span-2">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-[11px] font-medium text-portal-muted mb-1">Actividad</p>
          <h2 className="text-lg font-semibold text-white tracking-tight">Tu línea de tiempo</h2>
          <p className="text-sm text-portal-muted mt-1">
            Puntos, misiones, canjes y seguridad en un solo lugar · {items.length} eventos
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "portal-chip px-3 py-1.5 text-xs",
              filter === f.id ? "bg-portal-accent/20 text-white" : "text-portal-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-portal-muted py-8 text-center">Sin eventos en esta categoría todavía.</p>
      ) : (
        <ol className="relative space-y-0 max-h-[420px] overflow-y-auto pr-1">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-portal-accent/30 via-white/5 to-transparent" />
          {filtered.slice(0, 25).map((item) => {
            const Icon = iconFor(item.type);
            const isNegative = item.amount !== undefined && item.amount < 0;
            return (
              <li key={item.id} className="relative pl-10 pb-4">
                <span
                  className={cn(
                    "absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center",
                    item.positive === true && "bg-portal-success/15 text-portal-success",
                    item.positive === false && "bg-portal-danger/15 text-portal-danger",
                    item.positive === undefined && "bg-white/5 text-portal-muted"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate?.(item.sectionId)}
                  className="w-full text-left portal-stat p-3 group"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-portal-muted mt-0.5 truncate">{item.detail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {item.amount !== undefined && (
                        <p
                          className={cn(
                            "text-sm font-semibold tabular-nums flex items-center gap-0.5 justify-end",
                            isNegative ? "text-portal-danger" : "text-portal-success"
                          )}
                        >
                          {isNegative ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {Math.abs(item.amount).toLocaleString("es")} pts
                        </p>
                      )}
                      <p className="text-[10px] text-portal-muted mt-0.5">{formatRelativeTime(item.timestamp)}</p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
