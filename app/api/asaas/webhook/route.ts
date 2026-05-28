import { NextResponse } from "next/server";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

const TAG = "[asaas-webhook]";

type AsaasPaymentEvent = {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string | null;
    externalReference?: string | null;
    value: number;
    status: string;
    dueDate: string;
  };
  subscription?: {
    id: string;
    customer: string;
    externalReference?: string | null;
  };
};

async function findByCustomerId(id: string) {
  const r = await queryDb<{ id: string }>(
    `SELECT id FROM users WHERE stripe_customer_id = $1 LIMIT 1`,
    [id]
  );
  return r.rows[0] ?? null;
}

async function findBySubscriptionId(id: string) {
  const r = await queryDb<{ id: string }>(
    `SELECT id FROM users WHERE subscription_id = $1 LIMIT 1`,
    [id]
  );
  return r.rows[0] ?? null;
}

function parseRef(ref: string | null | undefined) {
  const parts = (ref ?? "").split(":");
  return {
    userId: parts[0] ?? "",
    type: parts[1] ?? "",       // planKey OR "addon"
    second: parts[2] ?? "",     // billingCycle OR addonType
    third: parts[3] ?? "",      // workspaceSlug (addon only)
  };
}

function calcPeriodEnd(dueDate: string, cycle: string): Date {
  const d = new Date(`${dueDate}T12:00:00Z`);
  if (cycle === "yearly") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  d.setDate(d.getDate() + 5); // 5-day grace
  return d;
}

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  let body: AsaasPaymentEvent;
  try {
    body = await request.json() as AsaasPaymentEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`${TAG} event=${body.event}`);

  try {
    switch (body.event) {

      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        const payment = body.payment;
        if (!payment) break;

        const ref = parseRef(payment.externalReference);

        // ── Add-on payment ────────────────────────────────────────────────────
        if (ref.type === "addon") {
          const addonType = ref.second;
          const workspaceSlug = ref.third;
          const unitPrice = addonType === "extra_whatsapp" ? 29 : 19;
          if (addonType && workspaceSlug) {
            await queryDb(
              `INSERT INTO billing_addons (workspace_slug, addon_type, quantity, unit_price, status)
               VALUES ($1, $2, 1, $3, 'active')
               ON CONFLICT (workspace_slug, addon_type) WHERE status = 'active'
               DO UPDATE SET quantity = 1, updated_at = NOW()`,
              [workspaceSlug, addonType, unitPrice]
            );
            console.log(`${TAG} add-on activated: ${addonType} workspace=${workspaceSlug}`);
          }
          break;
        }

        // ── Plan payment ──────────────────────────────────────────────────────
        const planKey = ref.type || "starter";
        const billingCycle = ref.second || "monthly";

        let user =
          ref.userId
            ? (await queryDb<{ id: string }>(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [ref.userId])).rows[0] ?? null
            : null;

        if (!user && payment.subscription) user = await findBySubscriptionId(payment.subscription);
        if (!user) user = await findByCustomerId(payment.customer);

        if (!user) {
          console.warn(`${TAG} PAYMENT_CONFIRMED — no user found ref=${payment.externalReference}`);
          break;
        }

        const periodEnd = calcPeriodEnd(payment.dueDate, billingCycle);

        await queryDb(
          `UPDATE users SET
             plan_type                = 'pro',
             is_active                = true,
             paid_access              = true,
             subscription_status      = 'active',
             subscription_plan        = $2,
             billing_cycle            = $3,
             plan_expires_at          = $4,
             next_payment_at          = $4,
             last_payment_at          = NOW(),
             subscription_started_at  = COALESCE(subscription_started_at, NOW()),
             subscription_canceled_at = NULL
           WHERE id = $1`,
          [user.id, planKey, billingCycle, periodEnd.toISOString()]
        );
        console.log(`${TAG} activated userId=${user.id} plan=${planKey} cycle=${billingCycle} expires=${periodEnd.toISOString()}`);
        break;
      }

      case "PAYMENT_OVERDUE": {
        const payment = body.payment;
        if (!payment) break;

        const ref = parseRef(payment.externalReference);
        if (ref.type === "addon") break; // add-on overdue — ignore for now

        let user =
          ref.userId
            ? (await queryDb<{ id: string }>(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [ref.userId])).rows[0] ?? null
            : null;
        if (!user && payment.subscription) user = await findBySubscriptionId(payment.subscription);
        if (!user) user = await findByCustomerId(payment.customer);

        if (user) {
          await queryDb(
            `UPDATE users SET paid_access = false, subscription_status = 'past_due' WHERE id = $1`,
            [user.id]
          );
          console.log(`${TAG} past_due userId=${user.id}`);
        }
        break;
      }

      case "SUBSCRIPTION_DELETED": {
        const subId = body.subscription?.id;
        if (!subId) break;
        const user = await findBySubscriptionId(subId);
        if (user) {
          await queryDb(
            `UPDATE users SET
               paid_access              = false,
               subscription_status      = 'canceled',
               is_active                = false,
               subscription_canceled_at = COALESCE(subscription_canceled_at, NOW())
             WHERE id = $1`,
            [user.id]
          );
          console.log(`${TAG} canceled userId=${user.id}`);
        }
        break;
      }

      default:
        console.log(`${TAG} unhandled event=${body.event}`);
    }
  } catch (err) {
    console.error(`${TAG} handler error:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
