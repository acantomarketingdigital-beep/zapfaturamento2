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
  settings: WorkspaceSettings | null | undefined,
  status: LeadStatus
): string {
  return settings?.kanban_labels?.[status] ?? LEAD_STATUS_LABELS[status];
}
