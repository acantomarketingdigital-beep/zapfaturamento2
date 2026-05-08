import { queryDb, hasDatabaseConfig } from "@/lib/db";
import fs from "fs";
import path from "path";

export type EnvStatus = "ok" | "missing";

export type SystemStatus = {
  db: {
    ok: boolean;
    latencyMs: number | null;
    error: string | null;
  };
  lastMigration: string;
  totalMigrations: number;
  vercel: {
    region: string;
    env: string;
    commitSha: string;
    url: string;
  };
  envs: { key: string; label: string; group: string; status: EnvStatus }[];
  checkedAt: string;
};

const ENV_CHECKS: { key: string; label: string; group: string }[] = [
  // Banco
  { key: "DATABASE_URL",            label: "DATABASE_URL",            group: "Banco"         },
  { key: "DATABASE_URL_UNPOOLED",   label: "DATABASE_URL_UNPOOLED",   group: "Banco"         },
  // Storage
  { key: "BLOB_READ_WRITE_TOKEN",   label: "BLOB_READ_WRITE_TOKEN",   group: "Storage"       },
  // App
  { key: "NEXT_PUBLIC_BASE_URL",    label: "NEXT_PUBLIC_BASE_URL",    group: "App"           },
  { key: "DASHBOARD_PASSWORD",      label: "DASHBOARD_PASSWORD",      group: "App"           },
  // Stripe
  { key: "STRIPE_SECRET_KEY",       label: "STRIPE_SECRET_KEY",       group: "Stripe"        },
  { key: "STRIPE_WEBHOOK_SECRET",   label: "STRIPE_WEBHOOK_SECRET",   group: "Stripe"        },
  { key: "STRIPE_PRICE_MONTHLY",    label: "STRIPE_PRICE_MONTHLY",    group: "Stripe"        },
  { key: "STRIPE_PRICE_YEARLY",     label: "STRIPE_PRICE_YEARLY",     group: "Stripe"        },
  // Evolution
  { key: "EVOLUTION_API_URL",       label: "EVOLUTION_API_URL",       group: "Evolution API" },
  { key: "EVOLUTION_API_KEY",       label: "EVOLUTION_API_KEY",       group: "Evolution API" },
  { key: "EVOLUTION_WEBHOOK_SECRET",label: "EVOLUTION_WEBHOOK_SECRET",group: "Evolution API" },
  // Meta
  { key: "META_APP_SECRET",         label: "META_APP_SECRET",         group: "Meta"          },
  { key: "META_WEBHOOK_VERIFY_TOKEN",label:"META_WEBHOOK_VERIFY_TOKEN",group:"Meta"          },
  { key: "META_PAGE_ACCESS_TOKEN",  label: "META_PAGE_ACCESS_TOKEN",  group: "Meta"          },
  // Kommo
  { key: "KOMMO_LONG_LIVED_TOKEN",  label: "KOMMO_LONG_LIVED_TOKEN",  group: "Kommo"         },
  { key: "KOMMO_SUBDOMAIN",         label: "KOMMO_SUBDOMAIN",         group: "Kommo"         },
];

export async function getSystemStatus(): Promise<SystemStatus> {
  // ── DB health ──────────────────────────────────────────────────
  let dbOk = false;
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  if (hasDatabaseConfig()) {
    const t = Date.now();
    try {
      await queryDb("SELECT 1");
      dbOk = true;
      dbLatencyMs = Date.now() - t;
    } catch (e) {
      dbError = e instanceof Error ? e.message.slice(0, 120) : "Erro desconhecido";
    }
  } else {
    dbError = "DATABASE_URL não configurada";
  }

  // ── Last migration ─────────────────────────────────────────────
  let lastMigration = "—";
  let totalMigrations = 0;
  try {
    const dir = path.join(process.cwd(), "database", "migrations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    totalMigrations = files.length;
    lastMigration = files[files.length - 1] ?? "—";
  } catch {
    // não crítico
  }

  // ── Vercel runtime info ────────────────────────────────────────
  const vercel = {
    region:    process.env.VERCEL_REGION            ?? "local",
    env:       process.env.VERCEL_ENV               ?? "development",
    commitSha: (process.env.VERCEL_GIT_COMMIT_SHA   ?? "").slice(0, 7) || "—",
    url:       process.env.VERCEL_URL               ?? process.env.NEXT_PUBLIC_BASE_URL ?? "—",
  };

  // ── Env vars ───────────────────────────────────────────────────
  const envs = ENV_CHECKS.map((e) => ({
    ...e,
    status: (process.env[e.key] ? "ok" : "missing") as EnvStatus,
  }));

  return {
    db: { ok: dbOk, latencyMs: dbLatencyMs, error: dbError },
    lastMigration,
    totalMigrations,
    vercel,
    envs,
    checkedAt: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
  };
}
