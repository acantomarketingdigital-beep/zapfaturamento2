import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { listInstancias, listCampanhasDisparos } from "@/lib/disparos";
import { listManagedClinics } from "@/lib/clinics";
import { DisparosManager } from "@/components/dashboard/DisparosManager";

export const dynamic = "force-dynamic";

export default async function DisparosPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const databaseReady = hasDatabaseConfig();
  const clientSlug    = user.clientSlug || "";

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
      <DashboardSidebar
        activePath="/dashboard/disparos"
        databaseReady={databaseReady}
        user={user}
      />
      <section className="dashboard-main">
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
