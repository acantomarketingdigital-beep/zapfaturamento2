import { queryDb } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DisparoInstancia = {
  id: string;
  client_slug: string;
  name: string;
  phone_number_id: string;
  access_token: string;
  waba_id: string | null;
  created_at: string;
};

export type CampanhaDisparo = {
  id: string;
  client_slug: string;
  instancia_id: string | null;
  instancia_name: string | null;
  name: string;
  message: string;
  status: "draft" | "running" | "paused" | "done" | "failed";
  total_contatos: number;
  sent: number;
  failed: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type DisparoLog = {
  id: number;
  campanha_id: string;
  phone: string;
  name: string | null;
  status: "pending" | "sent" | "failed" | "skipped";
  sent_at: string | null;
  error_msg: string | null;
  message_id: string | null;
};

// ─── Instancias ───────────────────────────────────────────────────────────────

export async function listInstancias(clientSlug: string): Promise<DisparoInstancia[]> {
  const result = await queryDb<DisparoInstancia>(
    `SELECT id, client_slug, name, phone_number_id, access_token, waba_id, created_at
     FROM disparo_instancias
     WHERE client_slug = $1
     ORDER BY created_at DESC`,
    [clientSlug]
  );
  return result.rows;
}

export async function createInstancia(data: {
  clientSlug: string;
  name: string;
  phoneNumberId: string;
  accessToken: string;
  wabaId?: string;
}): Promise<DisparoInstancia> {
  const result = await queryDb<DisparoInstancia>(
    `INSERT INTO disparo_instancias (client_slug, name, phone_number_id, access_token, waba_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, client_slug, name, phone_number_id, access_token, waba_id, created_at`,
    [data.clientSlug, data.name, data.phoneNumberId, data.accessToken, data.wabaId ?? null]
  );
  return result.rows[0];
}

export async function deleteInstancia(id: string, clientSlug: string): Promise<boolean> {
  const result = await queryDb(
    `DELETE FROM disparo_instancias WHERE id = $1 AND client_slug = $2`,
    [id, clientSlug]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getInstanciaById(id: string, clientSlug: string): Promise<DisparoInstancia | null> {
  const result = await queryDb<DisparoInstancia>(
    `SELECT id, client_slug, name, phone_number_id, access_token, waba_id, created_at
     FROM disparo_instancias WHERE id = $1 AND client_slug = $2`,
    [id, clientSlug]
  );
  return result.rows[0] ?? null;
}

// ─── Campanhas ────────────────────────────────────────────────────────────────

export async function listCampanhasDisparos(clientSlug: string): Promise<CampanhaDisparo[]> {
  const result = await queryDb<CampanhaDisparo>(
    `SELECT c.id, c.client_slug, c.instancia_id, i.name AS instancia_name,
            c.name, c.message, c.status,
            c.total_contatos, c.sent, c.failed,
            c.created_at, c.started_at, c.finished_at
     FROM campanhas_disparos c
     LEFT JOIN disparo_instancias i ON i.id = c.instancia_id
     WHERE c.client_slug = $1
     ORDER BY c.created_at DESC`,
    [clientSlug]
  );
  return result.rows;
}

export async function getCampanhaDisparoById(id: string, clientSlug: string): Promise<CampanhaDisparo | null> {
  const result = await queryDb<CampanhaDisparo>(
    `SELECT c.id, c.client_slug, c.instancia_id, i.name AS instancia_name,
            c.name, c.message, c.status,
            c.total_contatos, c.sent, c.failed,
            c.created_at, c.started_at, c.finished_at
     FROM campanhas_disparos c
     LEFT JOIN disparo_instancias i ON i.id = c.instancia_id
     WHERE c.id = $1 AND c.client_slug = $2`,
    [id, clientSlug]
  );
  return result.rows[0] ?? null;
}

export async function createCampanhaDisparo(data: {
  clientSlug: string;
  name: string;
  message: string;
  instanciaId?: string | null;
}): Promise<CampanhaDisparo> {
  const result = await queryDb<CampanhaDisparo>(
    `INSERT INTO campanhas_disparos (client_slug, name, message, instancia_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, client_slug, instancia_id, NULL::text AS instancia_name,
               name, message, status, total_contatos, sent, failed,
               created_at, started_at, finished_at`,
    [data.clientSlug, data.name, data.message, data.instanciaId ?? null]
  );
  return result.rows[0];
}

export async function updateCampanhaDisparo(
  id: string,
  clientSlug: string,
  data: { name?: string; message?: string; instanciaId?: string | null }
): Promise<boolean> {
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (data.name !== undefined) { vals.push(data.name); sets.push(`name = $${vals.length}`); }
  if (data.message !== undefined) { vals.push(data.message); sets.push(`message = $${vals.length}`); }
  if (data.instanciaId !== undefined) { vals.push(data.instanciaId); sets.push(`instancia_id = $${vals.length}`); }

  if (sets.length === 0) return false;

  vals.push(id); vals.push(clientSlug);
  const result = await queryDb(
    `UPDATE campanhas_disparos SET ${sets.join(", ")}
     WHERE id = $${vals.length - 1} AND client_slug = $${vals.length} AND status = 'draft'`,
    vals
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteCampanhaDisparo(id: string, clientSlug: string): Promise<boolean> {
  const result = await queryDb(
    `DELETE FROM campanhas_disparos WHERE id = $1 AND client_slug = $2 AND status IN ('draft', 'done', 'failed')`,
    [id, clientSlug]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function setCampanhaStatus(
  id: string,
  status: CampanhaDisparo["status"]
): Promise<void> {
  const now = new Date().toISOString();
  if (status === "running") {
    await queryDb(
      `UPDATE campanhas_disparos SET status = $1, started_at = $2 WHERE id = $3`,
      [status, now, id]
    );
  } else if (status === "done" || status === "failed") {
    await queryDb(
      `UPDATE campanhas_disparos SET status = $1, finished_at = $2 WHERE id = $3`,
      [status, now, id]
    );
  } else {
    await queryDb(`UPDATE campanhas_disparos SET status = $1 WHERE id = $2`, [status, id]);
  }
}

// ─── Contatos / Logs ──────────────────────────────────────────────────────────

export async function listDisparoLogs(campanhaId: string): Promise<DisparoLog[]> {
  const result = await queryDb<DisparoLog>(
    `SELECT id, campanha_id, phone, name, status, sent_at, error_msg, message_id
     FROM disparo_logs
     WHERE campanha_id = $1
     ORDER BY id ASC`,
    [campanhaId]
  );
  return result.rows;
}

export async function bulkInsertContatos(
  campanhaId: string,
  contacts: { phone: string; name?: string }[]
): Promise<number> {
  if (contacts.length === 0) return 0;

  // Clear existing pending contacts first
  await queryDb(
    `DELETE FROM disparo_logs WHERE campanha_id = $1 AND status = 'pending'`,
    [campanhaId]
  );

  const chunks = chunkArray(contacts, 500);
  let inserted = 0;

  for (const chunk of chunks) {
    const placeholders = chunk
      .map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
      .join(", ");
    const values: unknown[] = [campanhaId];
    for (const c of chunk) {
      values.push(c.phone, c.name ?? null);
    }
    const res = await queryDb(
      `INSERT INTO disparo_logs (campanha_id, phone, name) VALUES ${placeholders}`,
      values
    );
    inserted += res.rowCount ?? 0;
  }

  await queryDb(
    `UPDATE campanhas_disparos SET total_contatos = $1, sent = 0, failed = 0 WHERE id = $2`,
    [inserted, campanhaId]
  );

  return inserted;
}

export async function getPendingContatos(campanhaId: string): Promise<DisparoLog[]> {
  const result = await queryDb<DisparoLog>(
    `SELECT id, campanha_id, phone, name, status, sent_at, error_msg, message_id
     FROM disparo_logs
     WHERE campanha_id = $1 AND status = 'pending'
     ORDER BY id ASC`,
    [campanhaId]
  );
  return result.rows;
}

export async function markContatoSent(id: number, messageId: string): Promise<void> {
  await queryDb(
    `UPDATE disparo_logs SET status = 'sent', sent_at = NOW(), message_id = $1 WHERE id = $2`,
    [messageId, id]
  );
  await queryDb(
    `UPDATE campanhas_disparos SET sent = sent + 1
     WHERE id = (SELECT campanha_id FROM disparo_logs WHERE id = $1)`,
    [id]
  );
}

export async function markContatoFailed(id: number, errorMsg: string): Promise<void> {
  await queryDb(
    `UPDATE disparo_logs SET status = 'failed', sent_at = NOW(), error_msg = $1 WHERE id = $2`,
    [errorMsg, id]
  );
  await queryDb(
    `UPDATE campanhas_disparos SET failed = failed + 1
     WHERE id = (SELECT campanha_id FROM disparo_logs WHERE id = $1)`,
    [id]
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
