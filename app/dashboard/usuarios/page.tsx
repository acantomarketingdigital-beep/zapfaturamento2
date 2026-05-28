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

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  agency_admin:  { label: "Co-admin",           color: "#374151", bg: "#f3f4f6" },
  client_owner:  { label: "Dono do negócio",    color: "#1d4ed8", bg: "#eff6ff" },
  operator:      { label: "Atendente",           color: "#6d28d9", bg: "#f5f3ff" },
  client_user:   { label: "Usuário",             color: "#374151", bg: "#f3f4f6" },
};

function RoleBadge({ role }: { role: string }) {
  const r = ROLE_LABELS[role] ?? { label: role, color: "#374151", bg: "#f3f4f6" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      fontSize: "0.72rem", fontWeight: 600,
      color: r.color, background: r.bg,
      border: `1px solid ${r.color}33`,
    }}>
      {r.label}
    </span>
  );
}

function StatusBadge({ status, inviteExpired }: { status: string | null; inviteExpired: boolean }) {
  if (status === "active") {
    return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, background: "#d4edda", color: "#155724", border: "1px solid #28a74533" }}>Ativo</span>;
  }
  if (status === "pending" && inviteExpired) {
    return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, background: "#f8d7da", color: "#721c24", border: "1px solid #dc262633" }}>Expirado</span>;
  }
  if (status === "pending") {
    return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, background: "#fff3cd", color: "#856404", border: "1px solid #ffc10733" }}>Aguardando</span>;
  }
  return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, background: "#e9ecef", color: "#495057" }}>{status ?? "-"}</span>;
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
            Apenas administradores podem gerenciar usuários.
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
            <span className="dashboard-eyebrow">Equipe</span>
            <h2>Acesso e usuários</h2>
            <p>Convide clientes e colaboradores para acessar o sistema.</p>
          </div>
        </header>

        {/* Flow explanation */}
        <article className="dashboard-card" style={{ border: "1px solid #bfdbfe", background: "#f0f7ff" }}>
          <div className="dashboard-card__header">
            <h3 style={{ color: "#1d4ed8" }}>Como funciona o acesso</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                icon: "🏢",
                title: "Dono do negócio (ex: dono da clínica)",
                desc: "Você convida o seu cliente aqui. Ele vai receber um link, criar a senha e acessar o sistema. Ele vê só o negócio dele — campanhas, Kanban, relatórios e WhatsApp.",
              },
              {
                icon: "🎧",
                title: "Atendente / Secretaria",
                desc: "Para a equipe do cliente que precisa atender leads no dia a dia. Acessa o Kanban e o WhatsApp, mas não vê relatórios financeiros nem campanhas.",
              },
              {
                icon: "👤",
                title: "Co-administrador",
                desc: "Um parceiro seu com acesso completo ao sistema, igual ao seu. Use apenas para sócios ou pessoas de total confiança.",
              },
            ].map((item) => (
              <div key={item.icon} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", background: "#fff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                <span style={{ fontSize: "1.3rem", lineHeight: 1, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e3a5f" }}>{item.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "#374151", marginTop: 2, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Invite form */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Convidar pessoa</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: 0 }}>
              O convidado receberá um link para criar a senha e acessar o sistema.
            </p>
          </div>
          <InviteForm clients={clients} />
        </article>

        {/* Users list */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Pessoas com acesso</h3>
          </div>
          {users.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Nenhum usuário cadastrado ainda.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Nome / E-mail</th>
                    <th>Telefone</th>
                    <th>Perfil</th>
                    <th>Negócio</th>
                    <th>Status</th>
                    <th>Ações</th>
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
                          <div style={{ fontWeight: row.name ? 600 : 400 }}>{row.name || row.email}</div>
                          {row.name && <div className="dashboard-table__sub">{row.email}</div>}
                        </td>
                        <td>{row.phone || "—"}</td>
                        <td><RoleBadge role={row.role} /></td>
                        <td style={{ color: row.client_slug ? "var(--dark)" : "var(--muted)", fontSize: "0.82rem" }}>
                          {row.client_slug || "Todos"}
                        </td>
                        <td>
                          <StatusBadge status={row.status} inviteExpired={inviteExpired} />
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
          )}
        </article>
      </section>
    </main>
  );
}
