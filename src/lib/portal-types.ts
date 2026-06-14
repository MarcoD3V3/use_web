export type PortalSection = {
  id: string;
  title: string;
  category: string;
  summary: string;
  data: Record<string, unknown>;
};

export type PortalActivityItem = {
  id: string;
  type: "transaction" | "audit" | "redemption" | "mission" | "session";
  title: string;
  detail: string;
  timestamp: string;
  sectionId: string;
  amount?: number;
  positive?: boolean;
};

export type PlayerPortalPreferences = {
  emailDigest: boolean;
  missionReminders: boolean;
  publicProfile: boolean;
  activityFeedEnabled: boolean;
  showCharts: boolean;
  compactMode: boolean;
};

export type PlayerPortalDashboard = {
  generatedAt: string;
  player: {
    userId: string;
    username: string;
    displayName: string;
    tier: string;
    premium: boolean;
    tester: boolean;
  };
  sections: PortalSection[];
  stats: {
    totalSections: number;
    points: number;
    tierName: string | null;
    unreadNotifications: number;
    activeMissions: number;
    devicesOnline: number;
  };
  preferences?: PlayerPortalPreferences;
  activityFeed?: PortalActivityItem[];
  pointsChart?: Array<{ day: string; total: number; label: string }>;
};

export const CATEGORY_ORDER = [
  "Cuenta",
  "Recompensas",
  "Misiones",
  "Launcher",
  "Perfil",
  "Comunicación",
  "Actividad",
  "Social",
  "Personalización",
  "Contenido",
  "Eventos",
  "Seguridad",
  "Sistema",
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Cuenta: "👤",
  Recompensas: "🎁",
  Misiones: "🎯",
  Launcher: "🚀",
  Perfil: "🧑",
  Comunicación: "📢",
  Actividad: "⏱️",
  Social: "💬",
  Personalización: "✨",
  Contenido: "📦",
  Eventos: "🎉",
  Seguridad: "🛡️",
  Sistema: "⚙️",
};
