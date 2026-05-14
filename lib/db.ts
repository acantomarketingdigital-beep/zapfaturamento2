import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function getPool() {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL nao configurada.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  return pool;
}

function isTransientError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  return (
    msg.includes("control plane") ||
    msg.includes("endpoint is disabled") ||
    msg.includes("project is paused") ||
    msg.includes("connection terminated") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("connection refused")
  );
}

/**
 * Generates a workspace-aware client_slug filter.
 * Matches the value at $paramIdx whether it's a specific client slug
 * OR a workspace slug (expands to all member clients).
 */
export function clientSlugScope(paramIdx: number, tableAlias = ""): string {
  const col = tableAlias ? `${tableAlias}.client_slug` : "client_slug";
  return `${col} IN (
    SELECT $${paramIdx}::text
    UNION ALL
    SELECT c.client_slug FROM clients c
    WHERE c.workspace_slug = $${paramIdx}
       OR $${paramIdx} = ANY(COALESCE(c.shared_with_workspaces, '{}'))
  )`;
}

export async function queryDb<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  const p = getPool();
  try {
    return await p.query<T>(text, params);
  } catch (err) {
    if (!isTransientError(err)) throw err;
    // Neon cold-start: wait 1.5s then retry once
    await new Promise((r) => setTimeout(r, 1500));
    return p.query<T>(text, params);
  }
}
