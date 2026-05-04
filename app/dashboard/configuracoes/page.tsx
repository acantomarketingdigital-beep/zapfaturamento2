import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  getCurrentUser,
  isAgencyAdmin,
  isDashboardConfigured
} from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

type ConfigCard = {
  title: string;
  description: string;
  href: string;
  label: string;
  adminOnly?: boolean;
};

const CONFIG_CARDS: ConfigCard[] = [
  {
    title: "WhatsApp",
    description:
      "Conecte o WhatsApp da clinica via QR Code e receba mensagens dos leads automaticamente no Kanban.",
    href: "/dashboard/configuracoes/whatsapp",
    label: "Conectar WhatsApp"
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

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const databaseReady = hasDatabaseConfig();
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
              <h3>{card.title}</h3>
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

