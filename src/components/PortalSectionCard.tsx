"use client";

import type { ReactNode } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { PortalSection } from "@/lib/portal-types";
import { CATEGORY_ICONS } from "@/lib/portal-types";
import { hasRichSectionRenderer, PortalSectionContent } from "@/components/portal/PortalSectionContent";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function renderValue(value: unknown, depth = 0): ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-portal-muted/80 italic text-sm">Sin dato</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span className={cn("text-sm font-medium", value ? "text-portal-success" : "text-portal-muted")}>
        {value ? "Sí" : "No"}
      </span>
    );
  }

  if (typeof value === "number") {
    return <span className="font-mono text-sm tabular-nums">{value.toLocaleString("es")}</span>;
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return (
        <span className="text-sm text-portal-text/90" title={value}>
          {formatRelativeTime(value)}
        </span>
      );
    }
    if (value.startsWith("http")) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-portal-accent-soft text-sm break-all"
        >
          Abrir enlace
        </a>
      );
    }
    return <span className="text-sm break-words leading-relaxed">{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-portal-muted text-sm">Nada aquí todavía</span>;
    }
    if (depth > 1) {
      return <span className="text-sm text-portal-muted">{value.length} elementos</span>;
    }
    return (
      <ul className="space-y-2 mt-2">
        {value.slice(0, 12).map((item, i) => (
          <li key={i} className="portal-stat px-3 py-2.5 text-sm">
            {isPlainObject(item) ? (
              <dl className="grid gap-1.5">
                {Object.entries(item).map(([k, v]) => (
                  <div key={k} className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <dt className="text-portal-muted text-xs">{humanKey(k)}</dt>
                    <dd>{renderValue(v, depth + 1)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              renderValue(item, depth + 1)
            )}
          </li>
        ))}
        {value.length > 12 && (
          <li className="text-xs text-portal-muted pl-1">+{value.length - 12} más</li>
        )}
      </ul>
    );
  }

  if (isPlainObject(value)) {
    return (
      <dl className={cn("grid gap-0", depth > 0 && "mt-1")}>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="portal-data-row grid sm:grid-cols-[minmax(7rem,34%)_1fr] gap-1 sm:gap-4">
            <dt className="text-[11px] font-medium text-portal-muted leading-snug">{humanKey(k)}</dt>
            <dd className="min-w-0 text-portal-text/95">{renderValue(v, depth + 1)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span className="text-sm">{String(value)}</span>;
}

function humanKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

type Props = {
  section: PortalSection;
  onRedeem?: (redeemableId: string) => void;
  redeemingId?: string | null;
  showCharts?: boolean;
  compact?: boolean;
  onNavigate?: (sectionId: string) => void;
  onPreferenceChange?: (key: string, value: boolean) => void;
  preferenceLoadingKey?: string | null;
};

export function PortalSectionCard({
  section,
  onRedeem,
  redeemingId,
  showCharts = true,
  compact = false,
  onNavigate,
  onPreferenceChange,
  preferenceLoadingKey,
}: Props) {
  const redeemables =
    section.id === "rewards-shop" && Array.isArray(section.data.redeemables)
      ? (section.data.redeemables as Array<{
          id: string;
          name: string;
          cost: number;
          active?: boolean;
          description?: string;
        }>)
      : null;

  const rich = hasRichSectionRenderer(section.id);
  const icon = CATEGORY_ICONS[section.category] ?? "·";
  const wide = section.id === "portal-control-center" || section.id === "rewards-transactions";

  return (
    <article
      id={section.id}
      className={cn(
        "portal-card scroll-mt-24",
        compact ? "p-4" : "p-5 sm:p-6",
        wide && "lg:col-span-2"
      )}
    >
      <header className={cn("mb-5", compact && "mb-3")}>
        <div className="flex items-start gap-3">
          <span className="text-lg leading-none mt-0.5 opacity-80" aria-hidden>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-portal-muted mb-1">{section.category}</p>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">{section.title}</h3>
            <p className="text-sm text-portal-muted/90 mt-1.5 leading-relaxed">{section.summary}</p>
          </div>
        </div>
      </header>

      {redeemables && onRedeem ? (
        <div className="space-y-2">
          {redeemables.length === 0 ? (
            <p className="text-sm text-portal-muted">La tienda está vacía por ahora.</p>
          ) : (
            redeemables.map((item) => {
              const available = item.active !== false;
              return (
                <div
                  key={item.id}
                  className="portal-stat flex flex-wrap items-center justify-between gap-3 p-3.5"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-portal-muted mt-0.5 leading-relaxed">{item.description}</p>
                    )}
                    <p className="text-sm text-portal-accent-soft mt-1 tabular-nums">
                      {item.cost.toLocaleString("es")} pts
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!available || redeemingId === item.id}
                    onClick={() => onRedeem(item.id)}
                    className="portal-btn portal-btn-primary px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {redeemingId === item.id ? "Canjeando…" : "Canjear"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : rich ? (
        <PortalSectionContent
          section={section}
          showCharts={showCharts}
          onNavigate={onNavigate}
          onPreferenceChange={onPreferenceChange}
          preferenceLoadingKey={preferenceLoadingKey}
        />
      ) : (
        <div className="text-sm">{renderValue(section.data)}</div>
      )}
    </article>
  );
}
