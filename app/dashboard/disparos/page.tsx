import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig, queryDb } from "@/lib/db";
import { listInstancias, listCampanhasDisparos } from "@/lib/disparos";
import { listManagedClinics } from "@/lib/clinics";
import { DisparosManager } from "@/components/dashboard/DisparosManager";
import { getCachedBillingStatus } from "@/lib/billing";
import { isCrmPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function DisparosPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const databaseReady = hasDatabaseConfig();
  const clientSlug    = user.clientSlug || "";

  // CRM gate: check if user is CRM plan and if disparos add-on is active
  let isCrm = false;
  let hasDisparosAddon = false;
  if (databaseReady && user.kind !== "env_admin") {
    try {
      const billing = await getCachedBillingStatus(user.id).catch(() => null);
      isCrm = isCrmPlan(billing?.subscriptionPlan);
      if (isCrm && clientSlug) {
        const r = await queryDb<{ cnt: string }>(
          `SELECT COUNT(*) AS cnt FROM billing_addons
           WHERE workspace_slug = $1 AND addon_type = 'extra_disparos' AND status = 'active'`,
          [clientSlug]
        );
        hasDisparosAddon = parseInt(r.rows[0]?.cnt ?? "0", 10) > 0;
      }
    } catch { /* non-critical */ }
  }

  const sidebar = (
    <DashboardSidebar
      activePath="/dashboard/disparos"
      databaseReady={databaseReady}
      user={user}
    />
  );

  const pageHeader = (
    <header className="dashboard-topbar">
      <div>
        <span className="dashboard-eyebrow">WhatsApp</span>
        <h2>Disparos em Massa</h2>
        <p>
          Envie mensagens em massa via API Oficial do WhatsApp Business (Meta Cloud API)
          com delay automático entre os envios.
        </p>
      </div>
    </header>
  );

  // CRM users without disparos add-on → upsell screen
  if (isCrm && !hasDisparosAddon) {
    return (
      <main className="dashboard-shell">
        {sidebar}
        <section className="dashboard-main">
          {pageHeader}
          <article className="dashboard-card" style={{ textAlign: "center", padding: "48px 32px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🚀</div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: 8 }}>Disparos em Massa</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", maxWidth: 440, margin: "0 auto 24px" }}>
              Envie mensagens para toda sua lista de contatos com um clique.
              Disponível como add-on no plano CRM por <strong>R$49/mês</strong>.
            </p>
            <a
              href="/dashboard/assinatura"
              className="dashboard-button dashboard-button--brand"
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              Contratar Add-on
            </a>
          </article>
        </section>
      </main>
    );
  }

  let instancias: Awaited<ReturnType<typeof listInstancias>> = [];
  let campanhas: Awaited<ReturnType<typeof listCampanhasDisparos>> = [];
  let clients: Awaited<ReturnType<typeof listManagedClinics>> = [];
  try {
    [instancias, campanhas, clients] = await Promise.all([
      clientSlug ? listInstancias(clientSlug) : Promise.resolve([]),
      clientSlug ? listCampanhasDisparos(clientSlug) : Promise.resolve([]),
      listManagedClinics("", user.clientSlug)
    ]);
  } catch {
    // Non-fatal: render empty state
  }

  const safeInstancias = instancias.map((i) => ({
    id: i.id,
    client_slug: i.client_slug,
    name: i.name,
    phone_number_id: i.phone_number_id,
    waba_id: i.waba_id,
    created_at: i.created_at
  }));

  return (
    <main className="dashboard-shell">
      {sidebar}
      <section className="dashboard-main">
        {pageHeader}
        <DisparosManager
          clientSlug={clientSlug}
          isAgencyAdmin={user.role === "agency_admin"}
          clients={clients.map((c) => ({ clientSlug: c.clientSlug, clientName: c.clientName }))}
          initialInstancias={safeInstancias}
          initialCampanhas={campanhas}
        />
      </section>
    </main>
  );
}
