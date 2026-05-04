import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

const SUPPORT_EMAIL = "suporte.zapfaturamento@gmail.com";

export default async function SuportePage() {
  const user = await getCurrentUser();
  if (!user) return <DashboardLogin configured={isDashboardConfigured()} error="" />;

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/suporte"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Ajuda</span>
            <h2>Suporte</h2>
            <p>Precisa de ajuda? Entre em contato com nossa equipe.</p>
          </div>
        </header>

        <div className="dashboard-stats-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <article className="dashboard-card" style={{ padding: "1.75rem" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>📧</div>
            <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 8 }}>Suporte por E-mail</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 6 }}>
              Respondemos em ate 24h uteis. Ao entrar em contato, inclua:
            </p>
            <ul style={{ fontSize: "0.82rem", color: "var(--muted)", paddingLeft: "1.1rem", marginBottom: 18, lineHeight: 1.7 }}>
              <li>Descricao do problema</li>
              <li>Prints ou videos da tela</li>
              <li>Contexto do que estava fazendo</li>
            </ul>
            <div style={{ marginBottom: 10, fontSize: "0.82rem", color: "var(--muted)" }}>
              <strong style={{ color: "var(--dark)" }}>{SUPPORT_EMAIL}</strong>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Suporte%20-%20ZapFaturamento`}
              className="dashboard-button"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.82rem" }}
            >
              Enviar e-mail
            </a>
          </article>

          <article className="dashboard-card" style={{ padding: "1.75rem" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🐛</div>
            <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 8 }}>Relatar Problema</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 18 }}>
              Encontrou um erro ou comportamento inesperado? Nos informe para corrigir o mais rapido possivel.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Problema%20encontrado%20no%20ZapFaturamento`}
              className="dashboard-button dashboard-button--ghost"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.82rem" }}
            >
              Relatar problema
            </a>
          </article>
        </div>

        <article className="dashboard-card" style={{ marginTop: "1.25rem", padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 12 }}>Dicas rapidas</h3>
          <ul style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.9, paddingLeft: "1.2rem" }}>
            <li>Para conectar o WhatsApp, va em <strong>Conexoes</strong> e gere um QR code.</li>
            <li>Para enviar um link ao cliente escanear o QR, use o botao <strong>Enviar link</strong> na conexao.</li>
            <li>Use <strong>Respostas Rapidas</strong> para salvar mensagens frequentes e agilizar o atendimento.</li>
            <li>Acompanhe o progresso dos leads no <strong>Pipeline</strong> e registre o valor das vendas.</li>
            <li>Visualize faturamento, ticket medio e ROI em <strong>Financeiro</strong>.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
