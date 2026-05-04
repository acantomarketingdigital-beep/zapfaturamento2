import { notFound } from "next/navigation";
import {
  getCurrentUser,
  isAgencyAdmin,
  isDashboardConfigured,
} from "@/lib/dashboard-auth";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { hasDatabaseConfig } from "@/lib/db";
import {
  getBusinessMetrics,
  getTrials,
  getSubscriptions,
  getAlerts,
  PERIOD_LABELS,
  DEFAULT_MONTHLY_PRICE,
  type TrialRow,
  type SubscriptionRow,
  type BusinessMetrics,
  type BusinessAlerts,
} from "@/lib/admin-business";

// ─── Types ─────────────────────────────────────────────────────────────────

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function param(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

// ─── Formatting helpers ────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMoney(cents: number): string {
  return `R$ ${cents.toLocaleString("pt-BR")}`;
}

// ─── Period tabs ──────────────────────────────────────────────────────────

function PeriodTabs({ current }: { current: string }) {
  const periods = [
    { value: "7d",         label: "7 dias" },
    { value: "30d",        label: "30 dias" },
    { value: "this_month", label: "Este mês" },
    { value: "last_month", label: "Mês passado" },
  ];
  return (
    <div className="admin-biz-period-tabs">
      {periods.map((p) => (
        <a
          key={p.value}
          href={`?period=${p.value}`}
          className={`admin-biz-period-tab${current === p.value ? " admin-biz-period-tab--active" : ""}`}
        >
          {p.label}
        </a>
      ))}
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────

type CardColor = "green" | "blue" | "yellow" | "red" | "purple" | "gray";

function MetricCard({
  label,
  value,
  sub,
  color = "gray",
  small = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: CardColor;
  small?: boolean;
}) {
  return (
    <div className={`admin-biz-card admin-biz-card--${color}`}>
      <span className="admin-biz-card__label">{label}</span>
      <span className={`admin-biz-card__value${small ? " admin-biz-card__value--sm" : ""}`}>
        {value}
      </span>
      {sub && <span className="admin-biz-card__sub">{sub}</span>}
    </div>
  );
}

// ─── Status pills ─────────────────────────────────────────────────────────

const TRIAL_STATUS_CONFIG = {
  ativo:      { label: "Ativo",      color: "blue"   },
  expirando:  { label: "Expirando",  color: "yellow" },
  expirado:   { label: "Expirado",   color: "red"    },
  convertido: { label: "Convertido", color: "green"  },
} as const;

const SUB_STATUS_CONFIG = {
  trial:     { label: "Trial",     color: "blue"   },
  active:    { label: "Ativo",     color: "green"  },
  past_due:  { label: "Atrasado",  color: "yellow" },
  canceled:  { label: "Cancelado", color: "red"    },
  expired:   { label: "Expirado",  color: "red"    },
  inactive:  { label: "Inativo",   color: "gray"   },
} as const;

function TrialStatusPill({ status }: { status: TrialRow["trial_status"] }) {
  const cfg = TRIAL_STATUS_CONFIG[status];
  return (
    <span className={`admin-status admin-status--${cfg.color}`}>{cfg.label}</span>
  );
}

function SubStatusPill({ status }: { status: SubscriptionRow["sub_status"] }) {
  const cfg = SUB_STATUS_CONFIG[status] ?? { label: status, color: "gray" };
  return (
    <span className={`admin-status admin-status--${cfg.color}`}>{cfg.label}</span>
  );
}

// ─── Action forms ─────────────────────────────────────────────────────────

function ActionBtn({
  href,
  label,
  variant = "ghost",
}: {
  href: string;
  label: string;
  variant?: "ghost" | "danger" | "brand";
}) {
  const cls = [
    "dashboard-button",
    "dashboard-button--sm",
    variant === "danger" ? "dashboard-button--danger" : "",
    variant === "brand"  ? "dashboard-button--brand"  : "dashboard-button--ghost",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form action={href} method="post" style={{ display: "inline" }}>
      <button type="submit" className={cls}>
        {label}
      </button>
    </form>
  );
}

// ─── Alerts section ───────────────────────────────────────────────────────

function AlertsSection({ alerts }: { alerts: BusinessAlerts }) {
  const items: { level: "warning" | "danger" | "info"; text: string }[] = [];

  if (alerts.expiringToday.length > 0)
    items.push({ level: "danger", text: `${alerts.expiringToday.length} trial(s) expiram hoje` });

  if (alerts.expiring2Days.length > 0)
    items.push({ level: "warning", text: `${alerts.expiring2Days.length} trial(s) expiram nos próximos 2 dias` });

  if (alerts.expired.length > 0)
    items.push({ level: "warning", text: `${alerts.expired.length} trial(s) expirado(s) sem conversão` });

  if (alerts.overdueSubscriptions.length > 0)
    items.push({ level: "danger", text: `${alerts.overdueSubscriptions.length} assinatura(s) vencida(s) / atrasada(s)` });

  if (alerts.noPhone > 0)
    items.push({ level: "info", text: `${alerts.noPhone} usuário(s) sem número de telefone cadastrado` });

  if (items.length === 0) return null;

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Alertas de negócio</h3>
      </div>
      <div className="admin-biz-alerts">
        {items.map((item, i) => (
          <div key={i} className={`admin-biz-alert admin-biz-alert--${item.level}`}>
            <span>
              {item.level === "danger"  ? "🔴" : item.level === "warning" ? "⚠️" : "ℹ️"}
            </span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

// ─── Trials table ─────────────────────────────────────────────────────────

function TrialsTable({ trials }: { trials: TrialRow[] }) {
  if (trials.length === 0) {
    return (
      <article className="dashboard-card">
        <div className="dashboard-card__header"><h3>Trials</h3></div>
        <p style={{ padding: "16px 20px", color: "var(--muted)", fontSize: "0.85rem" }}>
          Nenhum usuário em trial ainda.
        </p>
      </article>
    );
  }

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Trials</h3>
        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
          {trials.length} registro(s)
        </span>
      </div>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Início</th>
              <th>Expira em</th>
              <th>Dias</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {trials.map((t) => {
              const isUrgent = t.trial_status === "expirando" || t.trial_status === "expirado";
              return (
                <tr key={t.id} style={isUrgent ? { background: "rgba(254,243,199,0.4)" } : undefined}>
                  <td style={{ fontWeight: 500 }}>{t.email}</td>
                  <td>{t.phone ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td>{fmtDate(t.trial_started_at)}</td>
                  <td>{fmtDate(t.trial_expires_at)}</td>
                  <td>
                    {t.days_left !== null
                      ? <strong style={{ color: t.days_left <= 1 ? "#dc2626" : "inherit" }}>
                          {t.days_left}d
                        </strong>
                      : <span style={{ color: "var(--muted)" }}>—</span>}
                  </td>
                  <td><TrialStatusPill status={t.trial_status} /></td>
                  <td>
                    <div className="admin-actions">
                      {t.trial_status !== "convertido" && (
                        <ActionBtn
                          href={`/api/admin/users/${t.id}/extend-trial`}
                          label="+7 dias"
                        />
                      )}
                      {(t.trial_status === "expirado" || t.trial_status === "expirando") && (
                        <ActionBtn
                          href={`/api/admin/users/${t.id}/activate`}
                          label="Ativar"
                          variant="brand"
                        />
                      )}
                      {t.status === "pending" && t.invite_token && (
                        <form action="/dashboard/usuarios/resend" method="post" style={{ display: "inline" }}>
                          <input type="hidden" name="userId" value={t.id} />
                          <button type="submit" className="dashboard-button dashboard-button--sm dashboard-button--ghost">
                            Reenviar convite
                          </button>
                        </form>
                      )}
                      {t.is_active && (
                        <ActionBtn
                          href={`/api/admin/users/${t.id}/deactivate`}
                          label="Suspender"
                          variant="danger"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

// ─── Subscriptions table ──────────────────────────────────────────────────

function SubscriptionsTable({ subs }: { subs: SubscriptionRow[] }) {
  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Assinaturas e planos</h3>
        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
          {subs.length} registro(s)
        </span>
      </div>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Plano</th>
              <th>Valor/mês</th>
              <th>Status</th>
              <th>Desde</th>
              <th>Próx. cobrança</th>
              <th>Cancelado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.email}</td>
                <td>
                  <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
                    {s.plan_type}
                  </span>
                </td>
                <td>
                  {s.monthly_price
                    ? fmtMoney(s.monthly_price)
                    : s.plan_type === "pro"
                      ? <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                          R$ {DEFAULT_MONTHLY_PRICE} (padrão)
                        </span>
                      : <span style={{ color: "var(--muted)" }}>—</span>}
                </td>
                <td><SubStatusPill status={s.sub_status} /></td>
                <td>{fmtDate(s.subscription_started_at ?? s.created_at)}</td>
                <td>{fmtDate(s.next_payment_at ?? s.plan_expires_at)}</td>
                <td>
                  {s.subscription_canceled_at
                    ? <span style={{ color: "#dc2626" }}>{fmtDate(s.subscription_canceled_at)}</span>
                    : <span style={{ color: "var(--muted)" }}>—</span>}
                </td>
                <td>
                  <div className="admin-actions">
                    {s.sub_status !== "active" && (
                      <ActionBtn
                        href={`/api/admin/users/${s.id}/activate`}
                        label="Ativar"
                        variant="brand"
                      />
                    )}
                    {s.is_active && (
                      <ActionBtn
                        href={`/api/admin/users/${s.id}/deactivate`}
                        label="Suspender"
                        variant="danger"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function AdminBusinessPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  if (!isAgencyAdmin(user)) {
    notFound();
  }

  const params    = await searchParams;
  const period    = param(params.period) || "30d";
  const dbReady   = hasDatabaseConfig();

  const [metrics, trials, subs] = await Promise.all([
    getBusinessMetrics(period),
    getTrials(),
    getSubscriptions(),
  ]);

  const alerts = await getAlerts(trials, subs);

  const periodLabel = PERIOD_LABELS[period] ?? "Últimos 30 dias";

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/admin/business"
        databaseReady={dbReady}
        user={user}
      />

      <section className="dashboard-main">

        {/* Header */}
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow" style={{ color: "#dc2626" }}>
              Interno · Agency Admin Only
            </span>
            <h2>Painel de Negócio</h2>
            <p>
              Métricas de trials, conversão e receita — não visível no menu.
            </p>
          </div>
          <PeriodTabs current={period} />
        </header>

        {/* Metric cards */}
        <div className="admin-biz-metrics">
          <MetricCard
            label="Total de usuários"
            value={metrics.totalUsers}
            sub={`+${metrics.newUsersInPeriod} em ${periodLabel.toLowerCase()}`}
            color="gray"
          />
          <MetricCard
            label="Trials ativos"
            value={metrics.trialsAtivos}
            sub="em andamento"
            color="blue"
          />
          <MetricCard
            label="Trials expirados"
            value={metrics.trialsExpirados}
            sub="sem conversão"
            color={metrics.trialsExpirados > 0 ? "yellow" : "gray"}
          />
          <MetricCard
            label="Clientes ativos"
            value={metrics.clientesAtivos}
            sub="plano Pro"
            color="green"
          />
          <MetricCard
            label="MRR estimado"
            value={fmtMoney(metrics.mrr)}
            sub={`base: R$ ${DEFAULT_MONTHLY_PRICE}/usuário`}
            color="green"
            small
          />
          <MetricCard
            label="Assinaturas ativas"
            value={metrics.assinaturasAtivas}
            color="green"
          />
          <MetricCard
            label="Conversão trial → pago"
            value={metrics.conversionRate}
            color={metrics.conversionRate === "Dados insuficientes" ? "gray" : "purple"}
            small={metrics.conversionRate === "Dados insuficientes"}
          />
          <MetricCard
            label="Churn (período)"
            value={metrics.churnRate}
            color={metrics.churnRate === "Dados insuficientes" ? "gray" : "red"}
            small={metrics.churnRate === "Dados insuficientes"}
          />
        </div>

        {/* Alerts */}
        <AlertsSection alerts={alerts} />

        {/* Trials */}
        <TrialsTable trials={trials} />

        {/* Subscriptions */}
        <SubscriptionsTable subs={subs} />

      </section>
    </main>
  );
}
