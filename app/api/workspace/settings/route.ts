import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import {
  getWorkspaceSettings,
  saveWorkspaceSettings,
  type WorkspaceSettings,
} from "@/lib/workspace-settings";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const settings = await getWorkspaceSettings(user.clientSlug);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const clientSlug = user.clientSlug;
  if (!clientSlug) return NextResponse.json({ error: "Workspace nao identificado." }, { status: 400 });

  const body = (await request.json()) as Partial<WorkspaceSettings>;

  const current = await getWorkspaceSettings(clientSlug);

  const updated: WorkspaceSettings = {
    kanban_labels: body.kanban_labels ?? current.kanban_labels,
    crm_tags_preset: body.crm_tags_preset ?? current.crm_tags_preset,
    team_members: body.team_members ?? current.team_members,
  };

  await saveWorkspaceSettings(clientSlug, updated);
  return NextResponse.json({ ok: true, settings: updated });
}
