import { headers } from "next/headers";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { listSmsBlasts } from "@/lib/sms-blasts";
import { getClinicBySlug } from "@/lib/clinics";
import { getUserPermissions } from "@/lib/permissions";
import { SmsBlastsManager } from "@/components/dashboard/SmsBlastsManager";

export const dynamic = "force-dynamic";

export default async function SmsDisparosPage() {
  const user = await getCurrentUser();
  if (!user) return <DashboardLogin configured={isDashboardConfigured()} error="" />;

  const databaseReady = hasDatabaseConfig();
  const clientSlug = user.clientSlug ?? "";

  const [blasts, clinic, perms] = databaseReady && clientSlug
    ? await Promise.all([
        listSmsBlasts(clientSlug),
        getClinicBySlug(clientSlug),
        getUserPermissions(user.id, user.role),
      ])
    : [[], null, await getUserPermissions(user.id, user.role)];

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  const defaultWhatsappNumber = clinic?.whatsappNumber ?? "";
  const canManage = perms.campanhas_create === true || user.role === "agency_admin" || user.kind === "env_admin";

  return (
    <main className="dashboard-shell">
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">SMS</span>
            <h2>Disparos SMS</h2>
            <p>Promoções com imagem, link curto e página dedicada. O lead clica e vai direto pro WhatsApp.</p>
          </div>
        </header>

        {!databaseReady && (
          <div className="dashboard-alert dashboard-alert--warning" style={{ marginBottom: 20 }}>
            Configure <code>DATABASE_URL</code> para usar essa funcionalidade.
          </div>
        )}

        {databaseReady && !clientSlug && (
          <div className="dashboard-card">
            <div className="dashboard-empty">
              Para gerenciar promoções SMS, acesse um cliente específico em{" "}
              <a href="/dashboard/clinicas" style={{ color: "var(--brand, #2563eb)" }}>Clientes</a>.
            </div>
          </div>
        )}

        {databaseReady && clientSlug && (
          <div className="dashboard-card">
            <SmsBlastsManager
              initialBlasts={blasts}
              clientSlug={clientSlug}
              baseUrl={baseUrl}
              defaultWhatsappNumber={defaultWhatsappNumber}
              canManage={canManage}
            />
          </div>
        )}
      </section>
    </main>
  );
}
