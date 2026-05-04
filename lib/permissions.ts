import { hasDatabaseConfig, queryDb } from "@/lib/db";

export type UserPermissions = {
  // Navigation / page access
  dashboard: boolean;
  kanban: boolean;
  performance: boolean;
  relatorio: boolean;
  criativos: boolean;
  investimentos: boolean;
  exportar: boolean;
  clientes: boolean;
  usuarios: boolean;
  conexoes: boolean;
  // Campaigns
  campanhas_view: boolean;
  campanhas_create: boolean;
  campanhas_edit: boolean;
  // Campaign creatives
  criativos_view: boolean;
  criativos_create: boolean;
  criativos_edit: boolean;
  // WhatsApp group campaigns
  grupos_view: boolean;
  grupos_create: boolean;
  grupos_edit: boolean;
};

export const MODULE_LABELS: Record<keyof UserPermissions, string> = {
  dashboard:        "Visao Geral",
  kanban:           "Kanban - Leads",
  performance:      "Performance",
  relatorio:        "Relatorios",
  criativos:        "Criativos (pagina)",
  investimentos:    "Investimentos",
  exportar:         "Exportar Leads",
  clientes:         "Clientes",
  usuarios:         "Usuarios",
  conexoes:         "Conexoes WhatsApp",
  campanhas_view:   "Campanhas - Ver",
  campanhas_create: "Campanhas - Criar",
  campanhas_edit:   "Campanhas - Editar",
  criativos_view:   "Criativos - Ver",
  criativos_create: "Criativos - Criar",
  criativos_edit:   "Criativos - Editar",
  grupos_view:      "Grupos WA - Ver",
  grupos_create:    "Grupos WA - Criar",
  grupos_edit:      "Grupos WA - Editar",
};

export function allTruePermissions(): UserPermissions {
  return Object.fromEntries(
    Object.keys(MODULE_LABELS).map((k) => [k, true])
  ) as UserPermissions;
}

export function defaultPermissions(role: string): UserPermissions {
  const none = Object.fromEntries(
    Object.keys(MODULE_LABELS).map((k) => [k, false])
  ) as UserPermissions;

  if (role === "agency_admin") return allTruePermissions();

  if (role === "client_owner") {
    return {
      ...none,
      dashboard: true, kanban: true, performance: true,
      relatorio: true, criativos: true, exportar: true,
      campanhas_view: true, campanhas_create: true, campanhas_edit: true,
      criativos_view: true, criativos_create: true, criativos_edit: true,
      grupos_view: true, grupos_create: true, grupos_edit: true,
    };
  }

  if (role === "operator") {
    return {
      ...none,
      kanban: true,
      campanhas_view: true,
      criativos_view: true,
      grupos_view: true,
    };
  }

  // client_user (legacy)
  return { ...none, dashboard: true, kanban: true, performance: true };
}

export async function getUserPermissions(userId: string, role: string): Promise<UserPermissions> {
  const roleDefaults = defaultPermissions(role);

  if (!hasDatabaseConfig() || userId === "env-admin") return roleDefaults;

  try {
    const result = await queryDb<{ permissions: unknown }>(
      `SELECT permissions FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const raw = result.rows[0]?.permissions;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return roleDefaults;

    const stored = raw as Record<string, boolean>;
    return Object.fromEntries(
      (Object.keys(roleDefaults) as (keyof UserPermissions)[]).map((k) => [
        k,
        k in stored ? Boolean(stored[k]) : roleDefaults[k],
      ])
    ) as UserPermissions;
  } catch {
    return roleDefaults;
  }
}
