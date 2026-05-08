import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GroupCampaignsManager } from "@/components/dashboard/GroupCampaignsManager";
import { getCurrentUser, isDashboardConfigured, isAgencyAdmin } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { listGroupCampaigns } from "@/lib/group-campaigns";
import { listManagedClinics } from "@/lib/clinics";
import { getUserPermissions } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const adminUser = isAgencyAdmin(user);
  const scopeSlug = adminUser ? null : (user.clientSlug ?? null);

  const [campaigns, clientsRaw, perms] = await Promise.all([
    hasDatabaseConfig() ? listGroupCampaigns(scopeSlug) : Promise.resolve([]),
    hasDatabaseConfig() ? listManagedClinics("", user.clientSlug ?? null) : Promise.resolve([]),
    getUserPermissions(user.id, user.role),
  ]);

  const clients = clientsRaw.map((c) => ({ slug: c.clientSlug, name: c.clientName }));
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://zapfaturamento.com.br").trim().replace(/\/$/, "");

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/grupos"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">WhatsApp</span>
            <h2>Campanhas de Grupo</h2>
            <p>
              Rastreie cliques para entrar em grupos do WhatsApp via link intermediario com Pixel e CAPI.
            </p>
          </div>
        </header>

        <GroupCampaignsManager
          initialCampaigns={campaigns}
          isAgencyAdmin={adminUser}
          currentUserClientSlug={user.clientSlug ?? null}
          clients={clients}
          baseUrl={baseUrl}
          canCreate={perms.grupos_create}
        />
      </section>
    </main>
  );
}
