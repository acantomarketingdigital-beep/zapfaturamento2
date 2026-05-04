import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { listConversations } from "@/lib/whatsapp-connections";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connection_id") ?? undefined;
  const clientSlug = user.clientSlug;

  const conversations = await listConversations(clientSlug, connectionId);
  return NextResponse.json({ conversations });
}
