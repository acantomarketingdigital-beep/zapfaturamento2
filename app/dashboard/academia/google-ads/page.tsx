import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

const STEPS_WITH_SITE = [
  {
    title: "Criar Google Analytics",
    body: (
      <>
        <div>
          Acesse o <strong>Google Analytics</strong> e crie uma propriedade GA4 para o site do cliente.
        </div>
        <div className="guide-step__sub">
          Ao terminar, copie o <strong>Measurement ID</strong> — ele tem o formato{" "}
          <code>G-XXXXXXXXXX</code>. Voce vai precisar dele no proximo passo.
        </div>
      </>
    )
  },
  {
    title: "Instalar o Google Tag Manager",
    body: (
      <>
        <div>
          Acesse o <strong>Google Tag Manager</strong> e crie um container para o site.
        </div>
        <div className="guide-step__sub">
          Cole o codigo do GTM no <code>&lt;head&gt;</code> e no <code>&lt;body&gt;</code> de todas
          as paginas do site, conforme instrucoes do proprio GTM.
        </div>
      </>
    )
  },
  {
    title: "Configurar o Analytics no Tag Manager",
    body: (
      <>
        <div>
          Dentro do GTM, crie uma nova <strong>Tag</strong> do tipo{" "}
          <code>Google Analytics: GA4 Configuration</code>.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="guide-step__sub" style={{ margin: 0, minWidth: 140 }}>Measurement ID:</span>
            <code>G-XXXXXXXXXX</code>
            <span className="guide-step__sub" style={{ margin: 0 }}>(o ID copiado no Passo 1)</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="guide-step__sub" style={{ margin: 0, minWidth: 140 }}>Trigger:</span>
            <strong>All Pages</strong>
          </div>
        </div>
        <div className="guide-step__sub" style={{ marginTop: 6 }}>
          Salve e publique o container para ativar o rastreamento de paginas.
        </div>
      </>
    )
  },
  {
    title: "Criar a Tag de Conversao do Google Ads",
    body: (
      <>
        <div>
          Crie uma nova Tag do tipo <strong>Google Ads Conversion Tracking</strong>.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="guide-step__sub" style={{ margin: 0, minWidth: 140 }}>Conversion ID:</span>
            <span className="guide-step__sub" style={{ margin: 0 }}>Copie do Google Ads (Ferramentas → Conversoes)</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="guide-step__sub" style={{ margin: 0, minWidth: 140 }}>Conversion Label:</span>
            <span className="guide-step__sub" style={{ margin: 0 }}>Copie do mesmo local</span>
          </div>
        </div>
      </>
    )
  },
  {
    title: "Configurar o Disparo (Trigger)",
    body: (
      <>
        <div>
          Crie um Trigger do tipo <strong>Click — All Elements</strong> e configure as condicoes:
        </div>
        <div style={{ background: "var(--bg-subtle, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="guide-step__sub" style={{ margin: 0, fontWeight: 600 }}>
            Disparar quando <strong>Click URL</strong> contiver:
          </div>
          <code style={{ fontSize: "0.78rem" }}>wa.me</code>
          <code style={{ fontSize: "0.78rem" }}>api.whatsapp.com</code>
          <code style={{ fontSize: "0.78rem" }}>zapfaturamento.com.br/w/</code>
        </div>
        <div className="guide-step__sub" style={{ marginTop: 6 }}>
          Associe esse Trigger a Tag criada no Passo 4.
        </div>
      </>
    )
  },
  {
    title: "Testar tudo antes de publicar",
    body: (
      <>
        <div>
          Use o <strong>Modo Preview</strong> do Tag Manager para verificar se as tags estao
          disparando corretamente.
        </div>
        <div className="guide-step__sub" style={{ marginTop: 6 }}>
          Apos validar no GTM, abra o <strong>DebugView do Google Analytics</strong>{" "}
          (Administrador → DebugView) e confira se os eventos estao chegando em tempo real ao
          clicar no botao do WhatsApp.
        </div>
      </>
    )
  },
];

export default async function GoogleAdsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/configuracoes"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Academia · Google Ads</span>
            <h2>Como rastrear leads no Google Ads</h2>
            <p>
              Configure o rastreamento correto dependendo se voce usa ou nao uma landing page.
            </p>
          </div>
        </header>

        {/* Intro — dois cenarios */}
        <div className="dashboard-detail-grid">

          <article className="dashboard-card" style={{ borderLeft: "3px solid #22c55e" }}>
            <div className="dashboard-card__header">
              <h3>Cenario 1 — Sem site</h3>
            </div>
            <p className="dashboard-helper" style={{ marginBottom: 12 }}>
              Anuncio aponta direto para o link do Zap Faturamento, sem landing page.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600, color: "#1d4ed8" }}>Anuncio</span>
              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>→</span>
              <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600, color: "#15803d" }}>Link Zap Faturamento</span>
              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>→</span>
              <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600, color: "#15803d" }}>WhatsApp</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="guide-tip" style={{ margin: 0 }}>
                Nao precisa instalar Tag Manager nem Google Analytics.
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--muted)", paddingLeft: 4 }}>
                O sistema ja registra automaticamente cliques, leads e UTMs.
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--muted)", paddingLeft: 4 }}>
                O Google Analytics <strong>nao recebe</strong> dados de navegacao neste modelo.
              </div>
            </div>
          </article>

          <article className="dashboard-card" style={{ borderLeft: "3px solid #f59e0b" }}>
            <div className="dashboard-card__header">
              <h3>Cenario 2 — Com site (landing page)</h3>
            </div>
            <p className="dashboard-helper" style={{ marginBottom: 12 }}>
              Anuncio vai para um site; o botao do site leva ao WhatsApp.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600, color: "#1d4ed8" }}>Anuncio</span>
              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>→</span>
              <span style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600, color: "#c2410c" }}>Site</span>
              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>→</span>
              <span style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600, color: "#c2410c" }}>Botao</span>
              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>→</span>
              <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600, color: "#15803d" }}>WhatsApp</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="guide-tip guide-tip--warn" style={{ margin: 0 }}>
                Obrigatorio configurar Google Analytics + Tag Manager.
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--muted)", paddingLeft: 4 }}>
                Siga os 7 passos abaixo para configurar tudo corretamente.
              </div>
            </div>
          </article>

        </div>

        {/* Passos 1–6 */}
        <div className="dashboard-section-divider"><span>Configuracao passo a passo — Com site</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Passos 1 a 6 — Instalacao e configuracao</h3>
          </div>
          <ol className="guide-steps">
            {STEPS_WITH_SITE.map((step, i) => (
              <li key={i} className="guide-step">
                <span className="guide-step__num">{i + 1}</span>
                <div className="guide-step__text">
                  <div><strong>{step.title}</strong></div>
                  <div style={{ marginTop: 6 }}>{step.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </article>

        {/* Passo 7 — CRITICO */}
        <div className="dashboard-section-divider"><span>Passo critico — Nao pule este</span></div>

        <article className="dashboard-card" style={{ border: "2px solid #f59e0b" }}>
          <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "10px 16px", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <strong style={{ color: "#92400e", fontSize: "0.9rem" }}>
              Passo 7 — Obrigatorio: Marcar o evento como Conversao no Google Analytics
            </strong>
          </div>

          <div style={{ padding: "16px" }}>
            <p className="dashboard-helper" style={{ marginBottom: 14 }}>
              Depois que os primeiros leads comecar a chegar, voce <strong>precisa marcar o evento
              como conversao</strong> no Google Analytics. Sem isso, o Google nao sabe que aquele
              clique virou um lead e nao consegue otimizar suas campanhas corretamente.
            </p>

            <ol className="guide-steps">
              <li className="guide-step">
                <span className="guide-step__num">1</span>
                <span className="guide-step__text">Acesse o <strong>Google Analytics</strong>.</span>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">2</span>
                <div className="guide-step__text">
                  <div>No menu lateral esquerdo, va em:</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f3f4f6", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 10px", marginTop: 6, fontSize: "0.82rem", fontWeight: 600 }}>
                    Configurar → Eventos
                  </div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">3</span>
                <div className="guide-step__text">
                  <div>
                    Encontre o evento que representa o lead — geralmente{" "}
                    <code>click</code>,{" "}
                    <code>click_whatsapp</code> ou{" "}
                    <code>generate_lead</code>.
                  </div>
                  <div className="guide-step__sub" style={{ marginTop: 4 }}>
                    Se nao aparecer nenhum evento ainda, aguarde os primeiros cliques chegarem.
                  </div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">4</span>
                <div className="guide-step__text">
                  <div>
                    Na coluna da direita, ative a opcao:
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 12px", marginTop: 6, fontSize: "0.82rem", fontWeight: 600, color: "#15803d" }}>
                    ✓ Marcar como conversao
                  </div>
                </div>
              </li>
            </ol>

            <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 14px", marginTop: 16, display: "flex", gap: 10 }}>
              <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
              <div style={{ fontSize: "0.84rem", color: "#78350f", lineHeight: 1.6 }}>
                <strong>Se voce nao marcar o evento como conversao, o Google NAO vai otimizar
                suas campanhas corretamente.</strong> O algoritmo precisa saber o que e uma
                conversao para levar o anuncio para pessoas com maior chance de virar lead.
              </div>
            </div>
          </div>
        </article>

        {/* Integracao */}
        <div className="dashboard-section-divider"><span>Integracao com o Zap Faturamento</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>O que o Zap Faturamento ja faz por voce</h3>
          </div>
          <p className="dashboard-helper" style={{ marginBottom: 14 }}>
            Independente do cenario (com ou sem site), o Zap Faturamento rastreia automaticamente
            todos os leads via parametros UTM presentes no link.
          </p>
          <div className="guide-kanban-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {[
              { icon: "🔗", label: "UTMs automaticas", desc: "O link ja vem com utm_source, utm_campaign, gclid e outros parametros do Google." },
              { icon: "📊", label: "Origem do lead", desc: "Cada lead mostra de qual campanha, conjunto e criativo ele veio." },
              { icon: "💰", label: "Custo por lead", desc: "Registre o investimento na campanha para calcular o CPL automaticamente." },
              { icon: "📈", label: "ROAS em tempo real", desc: "Mova o card para Pago no Kanban e o faturamento aparece nos relatorios." },
            ].map((item) => (
              <div key={item.label} className="guide-kanban-stage" style={{ borderLeft: "3px solid #3b82f6" }}>
                <div className="guide-kanban-stage__name" style={{ borderLeft: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <div className="guide-kanban-stage__desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </article>

        {/* Resumo comparativo */}
        <div className="dashboard-section-divider"><span>Resumo rapido</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>O que precisa em cada cenario</h3>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Recurso</th>
                  <th style={{ textAlign: "center" }}>Sem site</th>
                  <th style={{ textAlign: "center" }}>Com site</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Tag Manager",                        false, true],
                  ["Google Analytics",                   false, true],
                  ["Tag de Conversao no GTM",            false, true],
                  ["Marcar evento como conversao (GA4)", false, true],
                  ["Rastreamento via UTMs",              true,  true],
                  ["Leads registrados no Zap",           true,  true],
                  ["Dados no Google Analytics",          false, true],
                ].map(([label, sem, com]) => (
                  <tr key={String(label)}>
                    <td>{label}</td>
                    <td style={{ textAlign: "center" }}>
                      {sem
                        ? <span style={{ color: "#15803d", fontWeight: 700 }}>✓</span>
                        : <span style={{ color: "#9ca3af" }}>—</span>
                      }
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {com
                        ? <span style={{ color: "#15803d", fontWeight: 700 }}>✓</span>
                        : <span style={{ color: "#9ca3af" }}>—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

      </section>
    </main>
  );
}
