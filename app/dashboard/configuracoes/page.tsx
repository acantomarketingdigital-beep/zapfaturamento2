import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isAgencyAdmin, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { listConnections } from "@/lib/whatsapp-connections";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const databaseReady = hasDatabaseConfig();

  // Fetch real WhatsApp connection status
  let connectedCount = 0;
  let totalConnections = 0;
  try {
    if (databaseReady) {
      const conns = await listConnections(user.clientSlug);
      totalConnections = conns.length;
      connectedCount = conns.filter((c) => c.status === "connected").length;
    }
  } catch {}

  const whatsappBadge =
    totalConnections === 0
      ? { label: "Nao configurado", color: "#9ca3af" }
      : connectedCount === totalConnections
      ? { label: `${connectedCount} conectado${connectedCount > 1 ? "s" : ""}`, color: "#10b981" }
      : connectedCount > 0
      ? { label: `${connectedCount}/${totalConnections} conectado${connectedCount > 1 ? "s" : ""}`, color: "#f59e0b" }
      : { label: `${totalConnections} desconectado${totalConnections > 1 ? "s" : ""}`, color: "#ef4444" };

  type ConfigCard = {
    title: string;
    description: string;
    href: string;
    label: string;
    adminOnly?: boolean;
    badge?: { label: string; color: string } | null;
  };

  const CONFIG_CARDS: ConfigCard[] = [
    {
      title: "WhatsApp",
      description:
        "Conecte o WhatsApp da clinica via QR Code e receba mensagens dos leads automaticamente no Kanban.",
      href: "/dashboard/configuracoes/whatsapp",
      label: "Gerenciar conexoes",
      badge: databaseReady ? whatsappBadge : null
    },
    {
      title: "Como usar",
      description:
        "Tutoriais passo a passo, guias de integracao e primeiros passos no sistema.",
      href: "/dashboard/academia",
      label: "Acessar tutoriais"
    },
    {
      title: "Equipe",
      description:
        "Gerencie usuarios da agencia, envie convites e configure permissoes de acesso.",
      href: "/dashboard/usuarios",
      label: "Gerenciar equipe",
      adminOnly: true
    },
    {
      title: "Exportar leads",
      description:
        "Exporte leads qualificados filtrados por status, cliente e periodo.",
      href: "/dashboard/exportar",
      label: "Exportar"
    },
    {
      title: "Assinatura",
      description:
        "Visualize seu plano atual, historico de faturas e opcoes de upgrade.",
      href: "/dashboard/assinatura",
      label: "Ver plano",
      adminOnly: true
    }
  ];

  const cards = CONFIG_CARDS.filter((c) => !c.adminOnly || isAgencyAdmin(user));

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/configuracoes"
        databaseReady={databaseReady}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Sistema</span>
            <h2>Configuracoes</h2>
            <p>Gerencie equipe, tutoriais, exportacoes e assinatura do sistema.</p>
          </div>
        </header>

        <div className="dashboard-config-grid">
          {cards.map((card) => (
            <article key={card.href} className="dashboard-card dashboard-config-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{card.title}</h3>
                {card.badge && (
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    background: card.badge.color + "22",
                    color: card.badge.color,
                    border: `1px solid ${card.badge.color}44`
                  }}>
                    {card.badge.label}
                  </span>
                )}
              </div>
              <p className="dashboard-helper">{card.description}</p>
              <a
                href={card.href}
                className="dashboard-button"
                style={{ textDecoration: "none", alignSelf: "flex-start", marginTop: "auto" }}
              >
                {card.label}
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
