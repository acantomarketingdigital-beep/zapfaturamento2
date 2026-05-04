import { getCurrentUser } from "@/lib/dashboard-auth";
import { queryDb } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone")?.replace(/@.*$/, "").replace(/\D/g, "");
  if (!phone) return new Response("Bad request", { status: 400 });

  const clientSlug = user.clientSlug;

  // Find any connected session to use
  const result = await queryDb<{ session_id: string }>(
    `SELECT session_id FROM whatsapp_connections
     WHERE status = 'connected'
     ${clientSlug ? "AND client_slug = $1" : ""}
     LIMIT 1`,
    clientSlug ? [clientSlug] : []
  );
  const session = result.rows[0];
  if (!session) return new Response("No connected session", { status: 404 });

  const evoUrl = (process.env.EVOLUTION_API_URL ?? "").replace(/\/$/, "");
  const evoKey = process.env.EVOLUTION_API_KEY ?? "";

  try {
    const res = await fetch(
      `${evoUrl}/chat/fetchProfilePictureUrl/${session.session_id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evoKey },
        body: JSON.stringify({ number: phone })
      }
    );

    if (!res.ok) return new Response("Not found", { status: 404 });

    const data = (await res.json()) as { profilePictureUrl?: string };
    const picUrl = data.profilePictureUrl;
    if (!picUrl) return new Response("No picture", { status: 404 });

    // Proxy the image so the client never needs to hit WhatsApp CDN directly
    const imgRes = await fetch(picUrl);
    if (!imgRes.ok) return new Response("Image unavailable", { status: 404 });

    const buf = await imgRes.arrayBuffer();
    const ct = imgRes.headers.get("content-type") ?? "image/jpeg";

    return new Response(buf, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return new Response("Error", { status: 500 });
  }
}
