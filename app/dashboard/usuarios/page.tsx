import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { InviteForm } from "@/components/dashboard/InviteForm";
import { UserActionsCell } from "@/components/dashboard/UserActionsCell";
import {
  getCurrentUser,
  isAgencyAdmin,
  isDashboardConfigured,
  listUsers
} from "@/lib/dashboard-auth";
import { listManagedClinics } from "@/lib/clinics";
import { hasDatabaseConfig } from "@/lib/db";

export const dynamic = "force-dynamic";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? "https://zapfaturamento.com.br").trim().replace(/\/$/, "");
}

function InviteStatusBadge({ status, inviteExpired }: { status: string | null; inviteExpired: boolean }) {
  if (status === "active") {
    return (
      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, background: "#d4edda", color: "#155724", border: "1px solid #28a745" }}>
        Ativo
      </span>
    );
  }
  if (status === "pending" && inviteExpired) {
    return (
      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, background: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb" }}>
        Expirado
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, background: "#fff3cd", color: "#856404", border: "1px solid #ffc107" }}>
        Pendente
      </span>
    );
  }
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, background: "#e9ecef", color: "#495057", border: "1px solid #ced4da" }}>
      {status ?? "-"}
    </span>
  );
}

export default async function UsersPage() {
  const user = await getCurrentUser();
  const databaseReady = hasDatabaseConfig();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  if (!isAgencyAdmin(user)) {
    return (
      <main className="dashboard-shell">
        <DashboardSidebar activePath="/dashboard/usuarios" databaseReady={databaseReady} user={user} />
        <section className="dashboard-main">
          <div className="dashboard-alert dashboard-alert--warning">
            Apenas agency_admin pode gerenciar usuarios.
          </div>
        </section>
      </main>
    );
  }

  const scopeSlug = user.clientSlug ?? null;
  const [users, clients] = await Promise.all([listUsers(scopeSlug), listManagedClinics("", scopeSlug)]);
  const baseUrl = getBaseUrl();

  return (
    <main className="dashboard-shell">
      <DashboardSidebar activePath="/dashboard/usuarios" databaseReady={databaseReady} user={user} />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Usuarios</span>
            <h2>Acesso multiusuario</h2>
            <p>Convide usuarios e defina permissoes por cliente.</p>
          </div>
        </header>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Convidar usuario</h3>
          </div>
          <InviteForm clients={clients} />
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Usuarios cadastrados</h3>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>E-mail / Nome</th>
                  <th>Telefone</th>
                  <th>Perfil</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Plano</th>
                  <th>Trial expira</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => {
                  const inviteExpired = row.status === "pending" && row.invite_expires_at
                    ? new Date(row.invite_expires_at) < new Date()
                    : false;
                  const inviteUrl = row.invite_token && !inviteExpired
                    ? `${baseUrl}/invite/${row.invite_token}`
                    : null;

                  return (
                    <tr key={row.id}>
                      <td>
                        <div>{row.email}</div>
                        {row.name ? <div className="dashboard-table__sub">{row.name}</div> : null}
                      </td>
                      <td>{row.phone || "-"}</td>
                      <td>{row.role}</td>
                      <td>{row.client_slug || "-"}</td>
                      <td>
                        <InviteStatusBadge status={row.status} inviteExpired={inviteExpired} />
                      </td>
                      <td>{row.plan_type || "pro"}</td>
                      <td>
                        {row.trial_expires_at
                          ? new Date(row.trial_expires_at).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                      <td>
                        <UserActionsCell
                          userId={row.id}
                          status={row.status}
                          inviteUrl={inviteUrl}
                          inviteExpired={inviteExpired}
                          phone={row.phone}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
