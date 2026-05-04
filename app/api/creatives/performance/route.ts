import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { getAllCreatives, getPlacementsData, type PerformanceOptions } from "@/lib/creatives-performance";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const opts: PerformanceOptions = {
    clientSlug: user.clientSlug || searchParams.get("clientSlug") || null,
    dateStart: searchParams.get("dateStart") || null,
    dateEnd: searchParams.get("dateEnd") || null,
  };

  const [all_creatives, placements] = await Promise.all([
    getAllCreatives(opts),
    getPlacementsData(opts),
  ]);

  const top_creatives = [...all_creatives]
    .filter((c) => c.leads > 0)
    .sort((a, b) =>
      b.leads !== a.leads ? b.leads - a.leads :
      b.agendados !== a.agendados ? b.agendados - a.agendados :
      b.fechados - a.fechados
    )
    .slice(0, 3);

  const summary = {
    total_creatives: all_creatives.length,
    total_leads: all_creatives.reduce((s, c) => s + c.leads, 0),
    total_scheduled: all_creatives.reduce((s, c) => s + c.agendados, 0),
    total_closed: all_creatives.reduce((s, c) => s + c.fechados, 0),
  };

  return NextResponse.json({ summary, top_creatives, all_creatives, placements });
}
