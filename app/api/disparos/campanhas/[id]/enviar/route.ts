import { getCurrentUser, canAccessClient } from "@/lib/dashboard-auth";
import {
  getCampanhaDisparoById,
  getInstanciaById,
  getPendingContatos,
  markContatoSent,
  markContatoFailed,
  setCampanhaStatus
} from "@/lib/disparos";
import { sendWhatsAppText } from "@/lib/meta-cloud-api";

export const runtime = "nodejs";
// Allow up to 5 min for large campaigns on Vercel Pro
export const maxDuration = 300;

type Params = { params: Promise<{ id: string }> };

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Nao autenticado." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { id } = await params;
  const { searchParams } = new URL(_req.url);
  const clientSlug = user.clientSlug || searchParams.get("clientSlug") || "";
  if (!clientSlug || !(await canAccessClient(user, clientSlug))) {
    return new Response(JSON.stringify({ error: "Sem permissao." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const campanha = await getCampanhaDisparoById(id, clientSlug);
  if (!campanha) {
    return new Response(JSON.stringify({ error: "Campanha nao encontrada." }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (campanha.status === "running") {
    return new Response(JSON.stringify({ error: "Disparo ja em andamento." }), {
      status: 409,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!campanha.instancia_id) {
    return new Response(JSON.stringify({ error: "Nenhuma instancia vinculada a campanha." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!campanha.message?.trim()) {
    return new Response(JSON.stringify({ error: "A mensagem da campanha esta vazia." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const instancia = await getInstanciaById(campanha.instancia_id, clientSlug);
  if (!instancia) {
    return new Response(JSON.stringify({ error: "Instancia nao encontrada." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const contatos = await getPendingContatos(id);
  if (contatos.length === 0) {
    return new Response(JSON.stringify({ error: "Nenhum contato pendente para envio." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  await setCampanhaStatus(id, "running");

  const encoder = new TextEncoder();
  let sent = 0;
  let failed = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: object) => {
        try { controller.enqueue(encoder.encode(sseEvent(data))); } catch {}
      };

      enqueue({ type: "start", total: contatos.length });

      for (const contato of contatos) {
        // Random delay 2000–3000 ms between messages
        const wait = 2000 + Math.floor(Math.random() * 1000);
        await delay(wait);

        const result = await sendWhatsAppText(
          instancia.phone_number_id,
          instancia.access_token,
          contato.phone,
          campanha.message
        );

        if (result.ok) {
          await markContatoSent(contato.id, result.messageId);
          sent++;
          enqueue({ type: "sent", id: contato.id, phone: contato.phone, sent, failed });
        } else {
          await markContatoFailed(contato.id, result.error);
          failed++;
          enqueue({ type: "failed", id: contato.id, phone: contato.phone, error: result.error, sent, failed });
        }
      }

      const finalStatus = failed > 0 && sent === 0 ? "failed" : "done";
      await setCampanhaStatus(id, finalStatus);
      enqueue({ type: "done", sent, failed, status: finalStatus });
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
