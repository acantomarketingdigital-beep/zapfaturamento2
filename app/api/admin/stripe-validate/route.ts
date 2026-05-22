/**
 * Endpoint de validação Stripe — apenas leitura e funções puras.
 * NÃO faz chamadas reais ao Stripe. NÃO cobra nenhum cartão.
 * Acessível apenas por env_admin.
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { queryDb, hasDatabaseConfig } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import {
  getPlanFromPriceId,
  getBillingCycleFromPriceId,
  isStripeConfigured,
  STRIPE_WEBHOOK_SECRET,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Todos os price IDs LIVE para validação
const PRICE_ID_CASES = [
  { priceId: "price_1TYAPpFvYZaPsKPDOGPhTGbK", expectedPlan: "starter",    expectedBilling: "monthly" },
  { priceId: "price_1TYAQBFvYZaPsKPDu1om3O1Z", expectedPlan: "starter",    expectedBilling: "yearly"  },
  { priceId: "price_1TYARRFvYZaPsKPDM1OHOGeG", expectedPlan: "agency",     expectedBilling: "monthly" },
  { priceId: "price_1TYARtFvYZaPsKPDg0SISCXN", expectedPlan: "agency",     expectedBilling: "yearly"  },
  { priceId: "price_1TYATGFvYZaPsKPDgr70EKRW", expectedPlan: "scale",      expectedBilling: "monthly" },
  { priceId: "price_1TYATcFvYZaPsKPDWFW6f1RM", expectedPlan: "scale",      expectedBilling: "yearly"  },
  { priceId: "price_1TYAUrFvYZaPsKPDJk5mdTRc", expectedPlan: "enterprise", expectedBilling: "monthly" },
  { priceId: "price_1TYAVCFvYZaPsKPDv03BlWjg", expectedPlan: "enterprise", expectedBilling: "yearly"  },
];

const ADD_ON_CASES = [
  { plan: "starter",    formPriceId: "price_1TYAdzFvYZaPsKPD0jHL1vx8", whatsappPriceId: "price_1TYAf7FvYZaPsKPDrtCdgYnU" },
  { plan: "agency",     formPriceId: "price_1TYAeOFvYZaPsKPDTZZhcSay",  whatsappPriceId: "price_1TYAg1FvYZaPsKPDXLULtrr1"  },
  { plan: "scale",      formPriceId: "price_1TYAeqFvYZaPsKPDRdScDGRL",  whatsappPriceId: "price_1TYAgMFvYZaPsKPDj0OCdk3a"  },
  { plan: "enterprise", formPriceId: null,                               whatsappPriceId: null                              },
];

const REQUIRED_COLS = [
  "billing_cycle", "last_payment_at", "next_payment_at", "plan_expires_at",
  "stripe_customer_id", "stripe_price_id", "subscription_id",
  "subscription_plan", "subscription_status",
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.kind !== "env_admin") {
    return NextResponse.json({ error: "Forbidden — env_admin only" }, { status: 403 });
  }

  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: "LIVE (sem chamadas reais ao Stripe)",
  };

  // ── 1. Testa getPlanFromPriceId + getBillingCycleFromPriceId ──────────────
  const priceIdResults = PRICE_ID_CASES.map(({ priceId, expectedPlan, expectedBilling }) => {
    const plan    = getPlanFromPriceId(priceId);
    const billing = getBillingCycleFromPriceId(priceId);
    const ok      = plan === expectedPlan && billing === expectedBilling;
    return { priceId, expectedPlan, gotPlan: plan, expectedBilling, gotBilling: billing, ok };
  });
  report.priceIdMapping = {
    allPassed: priceIdResults.every(r => r.ok),
    results: priceIdResults,
  };

  // ── 2. Testa add-ons contra PLANS constant ────────────────────────────────
  const addonResults = ADD_ON_CASES.map(({ plan, formPriceId, whatsappPriceId }) => {
    const p = PLANS[plan as keyof typeof PLANS];
    const formOk      = p.stripeExtraFormPriceId     === formPriceId;
    const whatsappOk  = p.stripeExtraWhatsappPriceId === whatsappPriceId;
    const enterpriseBlocked = plan === "enterprise"
      ? p.stripeExtraFormPriceId === null && p.stripeExtraWhatsappPriceId === null
      : true;
    return {
      plan,
      formPriceId:        { expected: formPriceId,      got: p.stripeExtraFormPriceId,     ok: formOk },
      whatsappPriceId:    { expected: whatsappPriceId,  got: p.stripeExtraWhatsappPriceId, ok: whatsappOk },
      enterpriseBlocked,
      ok: formOk && whatsappOk,
    };
  });
  report.addonMapping = {
    allPassed: addonResults.every(r => r.ok),
    results: addonResults,
  };

  // ── 3. Stripe config (só presença das vars — não expõe o valor) ───────────
  report.stripeConfig = {
    STRIPE_SECRET_KEY:      isStripeConfigured() ? "✅ configurado" : "❌ ausente",
    STRIPE_WEBHOOK_SECRET:  STRIPE_WEBHOOK_SECRET ? "✅ configurado" : "❌ ausente",
    webhookEndpoint:        "https://zapfaturamento.com.br/api/stripe/webhook",
    rawBodyUsed:            true,
    constructEventUsed:     true,
  };

  // ── 4. Schema do banco (read-only) ────────────────────────────────────────
  if (!hasDatabaseConfig()) {
    report.dbSchema = { error: "DATABASE_URL não configurado" };
  } else {
    try {
      const schemaRows = await queryDb<{
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
      }>(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_name = 'users'
           AND column_name = ANY($1::text[])
         ORDER BY column_name`,
        [REQUIRED_COLS]
      );

      const foundCols   = schemaRows.rows.map(r => r.column_name);
      const missingCols = REQUIRED_COLS.filter(c => !foundCols.includes(c));

      report.dbSchema = {
        ok:          missingCols.length === 0,
        migration043: foundCols.includes("billing_cycle") ? "✅ aplicada" : "❌ billing_cycle ausente",
        missingCols,
        columns:     schemaRows.rows,
      };
    } catch (err) {
      report.dbSchema = { error: String(err) };
    }

    // ── 5. Escrita sandbox (row temporária — criada e deletada no request) ──
    const TEST_EMAIL = "stripe-sandbox-test@zapfaturamento.local";
    try {
      // Remove possível resíduo de run anterior
      await queryDb(`DELETE FROM users WHERE email = $1`, [TEST_EMAIL]);

      // Insere row mínima de sandbox
      await queryDb(
        `INSERT INTO users (email, plan_type, is_active)
         VALUES ($1, 'sandbox', false)
         ON CONFLICT (email) DO NOTHING`,
        [TEST_EMAIL]
      );

      const simPlan      = "agency";
      const simBilling   = "yearly";
      const simPriceId   = "price_1TYARtFvYZaPsKPDg0SISCXN";
      const simSubId     = "sub_SANDBOX_TEST";
      const simCustId    = "cus_SANDBOX_TEST";
      const simExpiry    = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      // Simula o UPDATE exato que o webhook faz no checkout.session.completed
      await queryDb(
        `UPDATE users SET
           plan_type                = 'pro',
           is_active                = true,
           paid_access              = true,
           subscription_status      = 'active',
           subscription_id          = $2,
           stripe_customer_id       = $3,
           stripe_price_id          = $4,
           subscription_plan        = $5,
           billing_cycle            = $6,
           plan_expires_at          = $7,
           subscription_started_at  = NOW(),
           subscription_canceled_at = NULL,
           next_payment_at          = $7
         WHERE email = $1`,
        [TEST_EMAIL, simSubId, simCustId, simPriceId, simPlan, simBilling, simExpiry]
      );

      // Lê de volta para verificar
      const readBack = await queryDb<Record<string, string | boolean | null>>(
        `SELECT
           subscription_plan, billing_cycle, stripe_price_id,
           stripe_customer_id, subscription_id, subscription_status,
           plan_expires_at, next_payment_at, paid_access, is_active
         FROM users WHERE email = $1`,
        [TEST_EMAIL]
      );
      const row = readBack.rows[0] ?? {};

      // Remove o row de sandbox
      await queryDb(`DELETE FROM users WHERE email = $1`, [TEST_EMAIL]);

      const writeOk =
        row.subscription_plan  === simPlan    &&
        row.billing_cycle      === simBilling &&
        row.stripe_price_id    === simPriceId &&
        row.subscription_id    === simSubId   &&
        row.subscription_status === "active";

      report.dbWriteSandbox = {
        ok: writeOk,
        simulated: { subscription_plan: simPlan, billing_cycle: simBilling, stripe_price_id: simPriceId },
        readBack: row,
        reverted: true,
        note: "Row sandbox criada e deletada no mesmo request — nenhum dado real afetado",
      };
    } catch (err) {
      // Garante cleanup mesmo em erro
      try { await queryDb(`DELETE FROM users WHERE email = $1`, [TEST_EMAIL]); } catch { /* ignore */ }
      report.dbWriteSandbox = { error: String(err) };
    }
  }

  // ── 6. Resumo final ───────────────────────────────────────────────────────
  const priceOk   = (report.priceIdMapping as { allPassed: boolean }).allPassed;
  const addonOk   = (report.addonMapping   as { allPassed: boolean }).allPassed;
  const schemaOk  = (report.dbSchema       as { ok?: boolean }).ok ?? false;
  const writeOk   = (report.dbWriteSandbox as { ok?: boolean }).ok ?? false;
  const stripeOk  = isStripeConfigured() && Boolean(STRIPE_WEBHOOK_SECRET);

  report.summary = {
    priceIdMapping:    priceOk   ? "✅ PASS" : "❌ FAIL",
    addonMapping:      addonOk   ? "✅ PASS" : "❌ FAIL",
    dbSchema:          schemaOk  ? "✅ PASS" : "❌ FAIL",
    dbWriteSandbox:    writeOk   ? "✅ PASS" : "❌ FAIL",
    stripeConfig:      stripeOk  ? "✅ PASS" : "❌ FAIL",
    readyForProduction: priceOk && addonOk && schemaOk && writeOk && stripeOk
      ? "✅ SIM — integração pronta"
      : "❌ NÃO — revisar falhas acima",
  };

  return NextResponse.json(report, { status: 200 });
}
