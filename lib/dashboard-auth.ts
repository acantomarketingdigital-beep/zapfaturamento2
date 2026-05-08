import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasDatabaseConfig, queryDb } from "@/lib/db";
import { normalizeBillingPhone, startTrial } from "@/lib/billing";

export const DASHBOARD_COOKIE_NAME = "zap_session";

export type AppRole = "agency_admin" | "client_owner" | "client_user" | "operator";

export type AppSession = {
  kind: "user" | "env_admin";
  id: string;
  email: string;
  role: AppRole;
  clientSlug: string | null;
};

type StoredUserRow = {
  id: string;
  email: string;
  password_hash: string | null;
  role: AppRole;
  client_slug: string | null;
  status: string | null;
};

function getDashboardPassword() {
  return process.env.DASHBOARD_PASSWORD?.trim() || "";
}

function getAuthSecret() {
  return getDashboardPassword() || "zapfaturamento-local";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(value: string) {
  return createHash("sha256")
    .update(`${value}:${getAuthSecret()}`)
    .digest("hex");
}

function encodeSession(session: AppSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function decodeSession(value: string): AppSession | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  if (!safeEqual(signPayload(payload), signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AppSession;

    if (!parsed?.id || !parsed?.email || !parsed?.role) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function getUserByEmail(email: string) {
  if (!hasDatabaseConfig()) {
    return null;
  }

  const result = await queryDb<StoredUserRow>(
    `
      SELECT id, email, password_hash, role, client_slug, status
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email.trim()]
  );

  return result.rows[0] || null;
}

export async function listUsers(scopeClientSlug?: string | null) {
  if (!hasDatabaseConfig()) {
    return [];
  }

  const result = await queryDb<{
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: AppRole;
    client_slug: string | null;
    created_at: string;
    plan_type: string | null;
    trial_expires_at: string | null;
    status: string | null;
    invite_token: string | null;
    invite_expires_at: string | null;
  }>(
    `
      SELECT id, email, name, phone, role, client_slug, created_at, plan_type,
             trial_expires_at, status, invite_token, invite_expires_at
      FROM users
      WHERE (client_slug IS NOT DISTINCT FROM $1)
         OR ($1 IS NOT NULL AND client_slug IN (
               SELECT client_slug FROM clients WHERE workspace_slug = $1
             ))
      ORDER BY email ASC
    `,
    [scopeClientSlug ?? null]
  );

  return result.rows;
}

function generateTenantSlug(agencyName: string): string {
  const base = agencyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28) || "agencia";
  return `${base}-${randomUUID().slice(0, 6)}`;
}

export async function createAppUser(input: {
  email: string;
  password: string;
  role: AppRole;
  clientSlug?: string | null;
  phone?: string | null;
  name?: string | null;
  agencyName?: string | null;
}) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL nao configurada.");
  }

  const email = input.email.trim().toLowerCase();

  if (!email) {
    throw new Error("Informe um e-mail valido.");
  }

  if (input.password.trim().length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres.");
  }

  if (input.role === "client_user" && !input.clientSlug?.trim()) {
    throw new Error("Selecione um cliente para o usuario client_user.");
  }

  // Self-registered agency_admins get their own isolated tenant slug.
  // agencyName is only provided on self-registration (not admin-panel creates).
  // Existing super-admin (null clientSlug) created via admin panel keeps null.
  let tenantSlug: string | null = input.clientSlug?.trim() || null;
  if (input.role === "agency_admin" && !tenantSlug && input.agencyName?.trim()) {
    tenantSlug = generateTenantSlug(input.agencyName.trim());
  }

  const passwordHash = await hash(input.password.trim(), 10);
  const phoneNormalized = input.phone?.trim()
    ? normalizeBillingPhone(input.phone.trim())
    : null;

  const result = await queryDb<{ id: string }>(
    `
      INSERT INTO users (email, password_hash, role, client_slug, phone, phone_normalized, name, agency_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        client_slug = COALESCE(users.client_slug, EXCLUDED.client_slug),
        phone = COALESCE(EXCLUDED.phone, users.phone),
        phone_normalized = COALESCE(EXCLUDED.phone_normalized, users.phone_normalized),
        name = COALESCE(EXCLUDED.name, users.name),
        agency_name = COALESCE(EXCLUDED.agency_name, users.agency_name)
      RETURNING id
    `,
    [
      email,
      passwordHash,
      input.role,
      tenantSlug,
      input.phone?.trim() || null,
      phoneNormalized,
      input.name?.trim() || null,
      input.agencyName?.trim() || null,
    ]
  );

  const userId = result.rows[0]?.id;
  if (userId) {
    await startTrial(userId);
  }
}

export async function authenticateAppUser(email: string, password: string) {
  const candidateEmail = email.trim();
  const candidatePassword = password.trim();

  if (!candidatePassword) {
    return null;
  }

  const user = candidateEmail ? await getUserByEmail(candidateEmail) : null;

  if (user && user.password_hash && user.status !== "pending" && (await compare(candidatePassword, user.password_hash))) {
    return {
      kind: "user" as const,
      id: user.id,
      email: user.email,
      role: user.role,
      clientSlug: user.client_slug
    };
  }

  if (validateDashboardPassword(candidatePassword)) {
    return {
      kind: "env_admin" as const,
      id: "env-admin",
      email: candidateEmail || "admin@zapfaturamento.local",
      role: "agency_admin" as const,
      clientSlug: null
    };
  }

  return null;
}

export function isDashboardConfigured() {
  return Boolean(getDashboardPassword());
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(DASHBOARD_COOKIE_NAME)?.value || "";
  return decodeSession(token);
}

export async function isDashboardAuthenticated() {
  return Boolean(await getCurrentUser());
}

export function isAgencyAdmin(user: AppSession | null) {
  return user?.role === "agency_admin";
}

export function canAccessClient(user: AppSession | null, clientSlug: string, workspaceSlug?: string | null) {
  if (!user) return false;
  if (user.clientSlug === null) return true; // super-admin: null clientSlug = see everything
  if (user.clientSlug === clientSlug) return true;
  if (workspaceSlug != null && user.clientSlug === workspaceSlug) return true;
  return false;
}

export function createDashboardLoginResponse(
  session: AppSession,
  redirectTo: string,
  requestUrl: string
) {
  const response = NextResponse.redirect(new URL(redirectTo, requestUrl), 303);

  response.cookies.set(DASHBOARD_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}

export function clearDashboardSession(redirectTo: string, requestUrl: string) {
  const response = NextResponse.redirect(new URL(redirectTo, requestUrl), 303);

  response.cookies.set(DASHBOARD_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
  });

  return response;
}

export function validateDashboardPassword(candidate: string) {
  const password = getDashboardPassword();

  if (!password) {
    return false;
  }

  return safeEqual(candidate, password);
}
