"use client";

import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
  linkedSectionId?: string;
  onNavigate?: (sectionId: string) => void;
  loading?: boolean;
};

export function PortalToggle({
  checked,
  onChange,
  disabled,
  label,
  description,
  linkedSectionId,
  onNavigate,
  loading,
}: Props) {
  return (
    <div className="portal-stat flex items-start gap-3 p-3.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled || loading}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative shrink-0 w-11 h-6 rounded-full mt-0.5",
          checked ? "bg-portal-accent" : "bg-white/10",
          (disabled || loading) && "opacity-40 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow",
            checked && "translate-x-5"
          )}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-white">{label}</p>
          {loading && <span className="text-[10px] text-portal-muted">Guardando…</span>}
        </div>
        {description && <p className="text-xs text-portal-muted mt-1 leading-relaxed">{description}</p>}
        {linkedSectionId && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate(linkedSectionId)}
            className="text-[11px] text-portal-accent-soft mt-2"
          >
            Ver sección relacionada →
          </button>
        )}
      </div>
    </div>
  );
}
