import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { deleteConnectionUser } from "@/lib/whatsapp-connections";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id } = await params;
  await deleteConnectionUser(id);
  return NextResponse.json({ ok: true });
}
