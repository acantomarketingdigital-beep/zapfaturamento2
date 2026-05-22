import { hasDatabaseConfig, queryDb } from "@/lib/db";
import {
  DEFAULT_SETTINGS,
  type WorkspaceSettings,
} from "@/lib/workspace-settings-shared";

export type { WorkspaceSettings };
export { DEFAULT_SETTINGS, resolveKanbanLabel } from "@/lib/workspace-settings-shared";

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
