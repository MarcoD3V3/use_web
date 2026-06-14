"use client";

import type { ReactNode } from "react";
import { Copy, Crown, Sparkles, User } from "lucide-react";
import type { PortalSection, PlayerPortalPreferences } from "@/lib/portal-types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { PortalBarChart, PortalDonutChart, PortalProgressRing } from "@/components/portal/PortalCharts";
import { PortalToggle } from "@/components/portal/PortalToggle";

type Mission = {
  missionId: string;
  title: string;
  description?: string;
  progress: number;
  target: number;
  completed: boolean;
  rewardPoints: number;
};

type Transaction = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
};

type AuditEvent = {
  id?: string;
  action?: string;
  at?: string;
  meta?: string;
};

type PrefDef = {
  key: keyof PlayerPortalPreferences;
  label: string;
  description: string;
  category: string;
  linkedSectionId: string;
};

type Props = {
  section: PortalSection;
  showCharts?: boolean;
  onNavigate?: (sectionId: string) => void;
  onPreferenceChange?: (key: string, value: boolean) => void;
  preferenceLoadingKey?: string | null;
};

function DataTile({ label, value, hint, mono }: { label: string; value: ReactNode; hint?: string; mono?: boolean }) {
  return (
    <div className="portal-stat p-3.5">
      <p className="text-[11px] font-medium text-portal-muted mb-1.5">{label}</p>
      <div className={cn("text-sm text-white", mono && "font-mono tabular-nums")}>{value}</div>
      {hint && <p className="text-[10px] text-portal-muted mt-1.5">{hint}</p>}
    </div>
  );
}

function PerkPills({ perks }: { perks: string[] }) {
  if (!perks.length) return <span className="text-sm text-portal-muted italic">Sin ventajas extra</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {perks.map((p) => (
        <span key={p} className="portal-chip px-2.5 py-1 text-xs text-portal-accent-soft">
          {p}
        </span>
      ))}
    </div>
  );
}

function MissionList({ missions, empty }: { missions: Mission[]; empty: string }) {
  if (!missions.length) return <p className="text-sm text-portal-muted">{empty}</p>;
  return (
    <ul className="space-y-2">
      {missions.slice(0, 8).map((m) => {
        const pct = m.target > 0 ? Math.min(100, Math.round((m.progress / m.target) * 100)) : 0;
        return (
          <li key={m.missionId} className="portal-stat p-3.5">
            <div className="flex justify-between gap-2 mb-2">
              <p className="text-sm font-medium">{m.title}</p>
              <span className="text-xs text-portal-accent-soft tabular-nums shrink-0">+{m.rewardPoints} pts</span>
            </div>
            {m.description && <p className="text-xs text-portal-muted mb-2">{m.description}</p>}
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={cn("h-full rounded-full", m.completed ? "bg-portal-success" : "bg-portal-accent")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] text-portal-muted mt-1.5 tabular-nums">
              {m.progress}/{m.target} · {pct}%
              {m.completed && " · Completada"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function TimelineEvents({ events }: { events: AuditEvent[] }) {
  if (!events.length) return <p className="text-sm text-portal-muted">Sin eventos registrados.</p>;
  return (
    <ol className="space-y-2">
      {events.slice(0, 12).map((ev, i) => (
        <li key={ev.id ?? i} className="portal-stat flex gap-3 p-3">
          <span className="w-1.5 shrink-0 rounded-full bg-portal-accent/60 mt-1.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium capitalize">{(ev.action ?? "evento").replace(/_/g, " ")}</p>
            {ev.meta && <p className="text-xs text-portal-muted truncate">{ev.meta}</p>}
          </div>
          {ev.at && <span className="text-[10px] text-portal-muted shrink-0">{formatRelativeTime(ev.at)}</span>}
        </li>
      ))}
    </ol>
  );
}

function TransactionHistory({
  transactions,
  chart,
  showCharts,
}: {
  transactions: Transaction[];
  chart?: Array<{ label: string; total: number }>;
  showCharts?: boolean;
}) {
  return (
    <div className="space-y-4">
      {showCharts && chart && chart.length > 0 && (
        <div className="portal-stat p-4">
          <p className="text-[11px] font-medium text-portal-muted mb-3">Tendencia 7 días</p>
          <PortalBarChart data={chart} />
        </div>
      )}
      {transactions.length === 0 ? (
        <p className="text-sm text-portal-muted">Aún no hay movimientos de puntos.</p>
      ) : (
        <ul className="space-y-1.5">
          {transactions.map((tx) => (
            <li key={tx.id} className="portal-stat flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-sm truncate">{tx.reason}</p>
                <p className="text-[10px] text-portal-muted">{formatRelativeTime(tx.createdAt)}</p>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums shrink-0",
                  tx.amount >= 0 ? "text-portal-success" : "text-portal-danger"
                )}
              >
                {tx.amount >= 0 ? "+" : ""}
                {tx.amount.toLocaleString("es")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const RICH_SECTIONS = new Set([
  "account-identity",
  "account-tier",
  "rewards-tier-progress",
  "rewards-points",
  "rewards-transactions",
  "rewards-daily",
  "account-referral",
  "missions-active",
  "missions-daily",
  "missions-weekly",
  "missions-special",
  "missions-completed",
  "security-audit",
  "security-ban",
  "portal-control-center",
]);

export function hasRichSectionRenderer(sectionId: string): boolean {
  return RICH_SECTIONS.has(sectionId);
}

export function PortalSectionContent({
  section,
  showCharts = true,
  onNavigate,
  onPreferenceChange,
  preferenceLoadingKey,
}: Props) {
  const d = section.data;

  switch (section.id) {
    case "account-identity": {
      const userId = String(d.userId ?? "");
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 portal-stat p-4">
            <div className="w-14 h-14 rounded-2xl bg-portal-accent/15 flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-portal-accent-soft" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-white">{String(d.displayName ?? "—")}</p>
              <p className="text-sm text-portal-muted">@{String(d.username ?? "—")}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <DataTile
              label="ID de cuenta"
              mono
              value={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5"
                  onClick={() => navigator.clipboard?.writeText(userId)}
                  title="Copiar"
                >
                  {userId.slice(0, 18)}…
                  <Copy className="w-3 h-3 opacity-50" />
                </button>
              }
              hint="Identificador único en todo el ecosistema"
            />
            <DataTile
              label="Email"
              value={d.email ? String(d.email) : <span className="italic text-portal-muted">Sin dato</span>}
            />
            <DataTile
              label="Miembro desde"
              value={d.createdAt ? formatRelativeTime(String(d.createdAt)) : "—"}
              hint={d.createdAt ? new Date(String(d.createdAt)).toLocaleDateString("es") : undefined}
            />
          </div>
        </div>
      );
    }

    case "account-tier": {
      const premium = Boolean(d.premium);
      const tester = Boolean(d.tester);
      const perks = Array.isArray(d.tierPerks) ? (d.tierPerks as string[]) : [];
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="portal-chip px-3 py-1 text-sm">{String(d.tierName ?? d.tier ?? "free")}</span>
            {premium && (
              <span className="portal-chip portal-chip--premium px-3 py-1 inline-flex items-center gap-1">
                <Crown className="w-3 h-3" /> Premium
              </span>
            )}
            {tester && (
              <span className="portal-chip px-3 py-1 inline-flex items-center gap-1 text-portal-accent-soft">
                <Sparkles className="w-3 h-3" /> Tester
              </span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <DataTile label="Plan base" value={String(d.tier ?? "free")} />
            <DataTile label="Nombre de rango" value={String(d.tierName ?? "—")} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-portal-muted mb-2">Ventajas desbloqueadas</p>
            <PerkPills perks={perks} />
          </div>
        </div>
      );
    }

    case "rewards-tier-progress": {
      const pct = Number(d.progressPercent ?? 0);
      return (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <PortalProgressRing percent={pct} label={`${pct}%`} sublabel={String(d.currentTier ?? "Rango")} />
          <div className="flex-1 space-y-2 w-full">
            <DataTile label="Rango actual" value={String(d.currentTier ?? "—")} />
            {d.nextTier ? (
              <DataTile
                label="Siguiente objetivo"
                value={`${String(d.nextTier)} (${Number(d.nextRequired ?? 0).toLocaleString("es")} pts)`}
                hint="Sigue jugando y completando misiones para subir"
              />
            ) : (
              <DataTile label="Estado" value="Has alcanzado el rango máximo" hint="¡Felicidades!" />
            )}
          </div>
        </div>
      );
    }

    case "rewards-points": {
      const points = Number(d.points ?? 0);
      const lifetime = Number(d.lifetimePoints ?? 0);
      return (
        <div className="space-y-4">
          <div className="portal-stat p-5 text-center">
            <p className="text-[11px] text-portal-muted mb-1">Saldo disponible</p>
            <p className="text-3xl font-bold text-white tabular-nums">{points.toLocaleString("es")}</p>
            <p className="text-xs text-portal-muted mt-1">puntos</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <DataTile label="Puntos totales históricos" value={lifetime.toLocaleString("es")} mono />
            <DataTile label="Multiplicador XP" value={`×${Number(d.xpMultiplier ?? 1)}`} />
          </div>
        </div>
      );
    }

    case "rewards-transactions":
      return (
        <TransactionHistory
          transactions={(d.transactions as Transaction[]) ?? []}
          chart={Array.isArray(d.chart) ? (d.chart as Array<{ label: string; total: number }>) : undefined}
          showCharts={showCharts}
        />
      );

    case "missions-active":
    case "missions-daily":
    case "missions-weekly":
    case "missions-special":
      return <MissionList missions={(d.missions as Mission[]) ?? []} empty="No hay misiones en esta categoría." />;

    case "missions-completed": {
      const completed = (d.completed as Mission[]) ?? [];
      const total = Number(d.total ?? 0);
      const pending = Math.max(0, total - completed.length);
      return (
        <div className="space-y-4">
          {showCharts && total > 0 && (
            <PortalDonutChart
              segments={[
                { label: "Completadas", value: completed.length, color: "#34d399" },
                { label: "Pendientes", value: pending, color: "#7c83ff" },
              ]}
            />
          )}
          <MissionList missions={completed} empty="Aún no completaste misiones." />
        </div>
      );
    }

    case "security-audit":
      return <TimelineEvents events={(d.events as AuditEvent[]) ?? []} />;

    case "security-ban": {
      const banned = Boolean(d.banned);
      return (
        <div className="space-y-3">
          <div
            className={cn(
              "portal-stat p-4 flex items-center gap-3",
              banned ? "ring-1 ring-portal-danger/30" : "ring-1 ring-portal-success/20"
            )}
          >
            <span className={cn("w-3 h-3 rounded-full", banned ? "bg-portal-danger" : "bg-portal-success")} />
            <div>
              <p className="text-sm font-medium">{banned ? "Cuenta restringida" : "Cuenta en buen estado"}</p>
              <p className="text-xs text-portal-muted mt-0.5">
                {banned ? String(d.reason ?? "Contacta con moderación") : "Sin sanciones activas"}
              </p>
            </div>
          </div>
          <DataTile label="Alertas de chat" value={String(d.chatFlags ?? 0)} hint="Incidencias registradas en chat" />
        </div>
      );
    }

    case "portal-control-center": {
      const prefs = d.preferences as PlayerPortalPreferences | undefined;
      const defs = (d.definitions as PrefDef[]) ?? [];
      const global = d.globalFeatures as Record<string, boolean> | undefined;

      return (
        <div className="space-y-4">
          <p className="text-xs text-portal-muted leading-relaxed">
            Controla qué partes del ecosistema CraftLauncher se conectan contigo. Los cambios se guardan en tu cuenta.
          </p>
          <div className="space-y-2">
            {defs.map((def) => (
              <PortalToggle
                key={def.key}
                label={def.label}
                description={def.description}
                checked={Boolean(prefs?.[def.key])}
                loading={preferenceLoadingKey === def.key}
                linkedSectionId={def.linkedSectionId}
                onNavigate={onNavigate}
                onChange={(v) => onPreferenceChange?.(def.key, v)}
              />
            ))}
          </div>
          {global && (
            <>
              <div className="pt-2 portal-soft-divider" />
              <div>
                <p className="text-[11px] font-medium text-portal-muted mb-2">Features globales del launcher</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  <DataTile
                    label="Notificaciones"
                    value={global.notificationsEnabled ? "Activas" : "Pausadas"}
                    hint="Configurado por el admin"
                  />
                  <DataTile
                    label="Integraciones"
                    value={global.integrationsEnabled ? "Conectadas" : "Off"}
                    hint="Webhooks del ecosistema"
                  />
                  <DataTile
                    label="Experimentos"
                    value={global.experimentsEnabled ? "Habilitados" : "Off"}
                    hint="A/B tests del launcher"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    case "rewards-daily": {
      const canClaim = Boolean(d.canClaimToday);
      return (
        <div className="space-y-3">
          <div className="portal-stat p-5 text-center">
            <p className="text-2xl font-bold tabular-nums text-portal-accent-soft">
              +{Number(d.dailyBonus ?? 0).toLocaleString("es")} pts
            </p>
            <p className="text-xs text-portal-muted mt-1">bonus diario</p>
          </div>
          <DataTile
            label="Estado hoy"
            value={canClaim ? "Disponible al jugar" : "Ya reclamado hoy"}
            hint={d.lastClaimed ? `Último: ${formatRelativeTime(String(d.lastClaimed))}` : undefined}
          />
        </div>
      );
    }

    case "account-referral":
      return (
        <div className="space-y-3">
          <div className="portal-stat p-4 text-center">
            <p className="text-[11px] text-portal-muted mb-1">Tu código</p>
            <p className="text-xl font-mono font-semibold text-portal-accent-soft">{String(d.referralCode ?? "—")}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <DataTile label="Amigos invitados" value={String(d.referralsInvited ?? 0)} />
            <DataTile label="Bonus por referido" value={`${Number(d.referralBonus ?? 0)} pts`} />
          </div>
        </div>
      );

    default:
      return null;
  }
}
