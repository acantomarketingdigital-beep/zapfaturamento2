import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { hasDatabaseConfig, queryDb } from "@/lib/db";
import { startTrial, normalizeBillingPhone } from "@/lib/billing";
import type { AppRole } from "@/lib/dashboard-auth";
export { normalizeForWhatsApp, buildWhatsAppInviteUrl, buildWhatsAppMagicUrl } from "@/lib/invite-shared";
import { defaultPermissions, type UserPermissions } from "@/lib/permissions";
export { defaultPermissions };
export { MODULE_LABELS } from "@/lib/permissions";
export type { UserPermissions };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? "https://zapfaturamento.com.br").trim().replace(/\/$/, "");
}

function generateToken() {
  return randomBytes(32).toString("hex");
}

// ─── Invite ───────────────────────────────────────────────────────────────────

export async function createInvite(input: {
  name?: string | null;
  email: string;
  role: string;
  clientSlug?: string | null;
  permissions?: Partial<UserPermissions>;
  phone?: string | null;
}): Promise<{ userId: string; inviteUrl: string; phone: string | null }> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Informe um e-mail valido.");

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
  const permissions: UserPermissions = {
    ...defaultPermissions(input.role),
    ...input.permissions
  };

  const result = await queryDb<{ id: string }>(
    `INSERT INTO users (email, password_hash, role, client_slug, status, invite_token, invite_expires_at, permissions, name)
     VALUES ($1, NULL, $2, $3, 'pending', $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE SET
       role               = EXCLUDED.role,
       client_slug        = EXCLUDED.client_slug,
       status             = 'pending',
       invite_token       = EXCLUDED.invite_token,
       invite_expires_at  = EXCLUDED.invite_expires_at,
       permissions        = EXCLUDED.permissions,
       name               = COALESCE(EXCLUDED.name, users.name)
     RETURNING id`,
    [email, input.role, input.clientSlug || null, token, expiresAt.toISOString(), JSON.stringify(permissions), input.name || null]
  );

  const userId = result.rows[0]?.id;
  if (!userId) throw new Error("Erro ao criar convite.");

  await startTrial(userId);

  let savedPhone: string | null = null;
  if (input.phone?.trim()) {
    const phoneNorm = normalizeBillingPhone(input.phone.trim());
    await queryDb(
      `UPDATE users SET phone = $2, phone_normalized = $3 WHERE id = $1`,
      [userId, input.phone.trim(), phoneNorm]
    );
    savedPhone = input.phone.trim();
  } else {
    // Fetch existing phone if not provided
    const existing = await queryDb<{ phone: string | null }>(
      `SELECT phone FROM users WHERE id = $1`, [userId]
    );
    savedPhone = existing.rows[0]?.phone ?? null;
  }

  const inviteUrl = `${getBaseUrl()}/invite/${token}`;

  return { userId, inviteUrl, phone: savedPhone };
}

export async function resendInvite(
  userId: string
): Promise<{ inviteUrl: string; phone: string | null }> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  const result = await queryDb<{ email: string; phone: string | null }>(
    `UPDATE users SET invite_token = $2, invite_expires_at = $3
     WHERE id = $1 AND status = 'pending'
     RETURNING email, phone`,
    [userId, token, expiresAt.toISOString()]
  );

  const row = result.rows[0];
  if (!row) throw new Error("Usuario nao encontrado ou ja ativo.");

  const inviteUrl = `${getBaseUrl()}/invite/${token}`;

  return { inviteUrl, phone: row.phone };
}

// ─── Invite acceptance (passwordless) ────────────────────────────────────────

export async function getInviteByToken(token: string): Promise<{
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  invite_expires_at: string;
} | null> {
  if (!hasDatabaseConfig()) return null;
  const result = await queryDb<{
    id: string;
    email: string;
    phone: string | null;
    name: string | null;
    invite_expires_at: string;
  }>(
    `SELECT id, email, phone, name, invite_expires_at FROM users
     WHERE invite_token = $1 AND status = 'pending'
     LIMIT 1`,
    [token]
  );
  return result.rows[0] ?? null;
}

export async function acceptInvitePasswordless(
  token: string,
  name?: string
): Promise<{
  ok: boolean;
  error?: string;
  session?: { id: string; email: string; role: AppRole; clientSlug: string | null };
}> {
  if (!token?.trim()) return { ok: false, error: "Token invalido." };
  if (!hasDatabaseConfig()) return { ok: false, error: "Banco nao configurado." };

  const result = await queryDb<{
    id: string;
    email: string;
    role: AppRole;
    client_slug: string | null;
    invite_expires_at: string;
    status: string;
  }>(
    `SELECT id, email, role, client_slug, invite_expires_at, status FROM users
     WHERE invite_token = $1 AND status = 'pending'
     LIMIT 1`,
    [token]
  );

  const user = result.rows[0];
  if (!user) return { ok: false, error: "Link invalido ou ja utilizado." };

  if (new Date(user.invite_expires_at) < new Date()) {
    return { ok: false, error: "Link expirado. Solicite um novo convite ao administrador." };
  }

  await queryDb(
    `UPDATE users
     SET status = 'active',
         invite_token = NULL,
         invite_expires_at = NULL
         ${name?.trim() ? ", name = $2" : ""}
     WHERE id = $1`,
    name?.trim() ? [user.id, name.trim()] : [user.id]
  );

  return {
    ok: true,
    session: {
      id: user.id,
      email: user.email,
      role: user.role,
      clientSlug: user.client_slug
    }
  };
}

// ─── Activation (password-based, backward compat) ─────────────────────────────

export async function activateAccount(
  token: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  if (!token?.trim()) return { ok: false, error: "Token invalido." };
  if (password.trim().length < 6)
    return { ok: false, error: "A senha precisa ter pelo menos 6 caracteres." };

  if (!hasDatabaseConfig()) return { ok: false, error: "Banco nao configurado." };

  const result = await queryDb<{ id: string; invite_expires_at: string }>(
    `SELECT id, invite_expires_at FROM users
     WHERE invite_token = $1 AND status = 'pending'
     LIMIT 1`,
    [token]
  );

  const user = result.rows[0];
  if (!user) return { ok: false, error: "Link invalido ou ja utilizado." };

  if (new Date(user.invite_expires_at) < new Date()) {
    return { ok: false, error: "Link expirado. Solicite um novo convite ao administrador." };
  }

  const passwordHash = await hash(password.trim(), 10);

  await queryDb(
    `UPDATE users
     SET password_hash = $2, status = 'active', invite_token = NULL, invite_expires_at = NULL
     WHERE id = $1`,
    [user.id, passwordHash]
  );

  return { ok: true };
}

// ─── Magic login tokens ───────────────────────────────────────────────────────

export async function createMagicLoginToken(
  userId: string
): Promise<{ token: string; phone: string | null }> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  const result = await queryDb<{ phone: string | null }>(
    `UPDATE users
     SET magic_token = $2, magic_token_expires_at = $3, magic_token_used_at = NULL
     WHERE id = $1 AND status = 'active'
     RETURNING phone`,
    [userId, token, expiresAt.toISOString()]
  );

  if (!result.rows[0]) throw new Error("Usuario nao encontrado ou inativo.");

  return { token, phone: result.rows[0].phone };
}

export async function validateAndUseMagicToken(token: string): Promise<{
  id: string;
  email: string;
  role: AppRole;
  clientSlug: string | null;
} | null> {
  if (!token?.trim() || !hasDatabaseConfig()) return null;

  const result = await queryDb<{
    id: string;
    email: string;
    role: AppRole;
    client_slug: string | null;
    magic_token_expires_at: string;
    magic_token_used_at: string | null;
    status: string;
  }>(
    `SELECT id, email, role, client_slug, magic_token_expires_at, magic_token_used_at, status
     FROM users
     WHERE magic_token = $1
     LIMIT 1`,
    [token]
  );

  const user = result.rows[0];
  if (!user) return null;
  if (user.status !== "active") return null;
  if (user.magic_token_used_at) return null; // already used
  if (new Date(user.magic_token_expires_at) < new Date()) return null; // expired

  // Mark as used
  await queryDb(
    `UPDATE users SET magic_token_used_at = NOW() WHERE id = $1`,
    [user.id]
  );

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    clientSlug: user.client_slug
  };
}

export async function requestMagicLogin(emailOrPhone: string): Promise<{
  found: boolean;
  token?: string;
  magicUrl?: string;
  phone?: string | null;
}> {
  if (!hasDatabaseConfig()) return { found: false };

  const cleaned = emailOrPhone.trim();
  const isEmail = cleaned.includes("@");
  const phoneDigits = cleaned.replace(/\D/g, "");

  const result = await queryDb<{
    id: string;
    email: string;
    phone: string | null;
    status: string;
  }>(
    isEmail
      ? `SELECT id, email, phone, status FROM users WHERE LOWER(email) = LOWER($1) AND status = 'active' LIMIT 1`
      : `SELECT id, email, phone, status FROM users WHERE phone_normalized = $1 AND status = 'active' LIMIT 1`,
    [isEmail ? cleaned : phoneDigits]
  );

  const user = result.rows[0];
  if (!user) return { found: false };

  const { token, phone } = await createMagicLoginToken(user.id);
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://zapfaturamento.com.br").trim().replace(/\/$/, "");
  const magicUrl = `${baseUrl}/login/magic/${token}`;

  return { found: true, token, magicUrl, phone };
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function requestPasswordReset(
  email: string
): Promise<{ ok: boolean; resetUrl?: string }> {
  if (!hasDatabaseConfig() || !email?.trim()) return { ok: false };

  const userResult = await queryDb<{ id: string; email: string }>(
    `SELECT id, email FROM users
     WHERE LOWER(email) = LOWER($1) AND status = 'active'
     LIMIT 1`,
    [email.trim()]
  );

  const user = userResult.rows[0];
  if (!user) return { ok: false };

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await queryDb(
    `UPDATE users SET reset_token = $2, reset_token_expires_at = $3 WHERE id = $1`,
    [user.id, token, expiresAt.toISOString()]
  );

  const resetUrl = `${getBaseUrl()}/nova-senha?token=${token}`;
  return { ok: true, resetUrl };
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  if (!token?.trim()) return { ok: false, error: "Token invalido." };
  if (newPassword.trim().length < 6)
    return { ok: false, error: "A senha precisa ter pelo menos 6 caracteres." };

  if (!hasDatabaseConfig()) return { ok: false, error: "Banco nao configurado." };

  const result = await queryDb<{ id: string; reset_token_expires_at: string }>(
    `SELECT id, reset_token_expires_at FROM users
     WHERE reset_token = $1 AND status = 'active'
     LIMIT 1`,
    [token]
  );

  const user = result.rows[0];
  if (!user) return { ok: false, error: "Link invalido ou ja utilizado." };

  if (new Date(user.reset_token_expires_at) < new Date()) {
    return { ok: false, error: "Link expirado. Solicite uma nova redefinicao de senha." };
  }

  const passwordHash = await hash(newPassword.trim(), 10);

  await queryDb(
    `UPDATE users
     SET password_hash = $2, reset_token = NULL, reset_token_expires_at = NULL
     WHERE id = $1`,
    [user.id, passwordHash]
  );

  return { ok: true };
}
