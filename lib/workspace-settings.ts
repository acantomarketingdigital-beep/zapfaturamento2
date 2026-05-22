import { hasDatabaseConfig, queryDb } from "@/lib/db";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/kanban-shared";

export type WorkspaceSettings = {
  kanban_labels: Partial<Record<LeadStatus, string>>;
  crm_tags_preset: string[];
  team_members: string[];
};

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  kanban_labels: {},
  crm_tags_preset: [],
  team_members: [],
};

/** Returns the display label for a kanban status, respecting custom labels. */
export function resolveKanbanLabel(
  settings: WorkspaceSettings | null,
  status: LeadStatus
): string {
  return settings?.kanban_labels?.[status] ?? LEAD_STATUS_LABELS[status];
}

export async function getWorkspaceSettings(
  clientSlug: string | null | undefined
): Promise<WorkspaceSettings> {
  if (!hasDatabaseConfig() || !clientSlug) return DEFAULT_SETTINGS;

  const result = await queryDb<{ settings: WorkspaceSettings }>(
    `SELECT settings FROM workspace_settings WHERE client_slug = $1 LIMIT 1`,
    [clientSlug]
  );

  const raw = result.rows[0]?.settings;
  if (!raw) return DEFAULT_SETTINGS;

  return {
    kanban_labels: (raw as WorkspaceSettings).kanban_labels ?? {},
    crm_tags_preset: (raw as WorkspaceSettings).crm_tags_preset ?? [],
    team_members: (raw as WorkspaceSettings).team_members ?? [],
  };
}

export async function saveWorkspaceSettings(
  clientSlug: string,
  settings: WorkspaceSettings
): Promise<void> {
  if (!hasDatabaseConfig()) return;

  await queryDb(
    `INSERT INTO workspace_settings (client_slug, settings, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (client_slug)
     DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()`,
    [clientSlug, JSON.stringify(settings)]
  );
}
