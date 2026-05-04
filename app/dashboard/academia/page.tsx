import { CopyButton } from "@/components/dashboard/CopyButton";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

const metaLink = `/w/[cliente]/[campanha]?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}`;
const googleLink = `/w/[cliente]/[campanha]?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&gclid={gclid}&device={device}&network={network}&matchtype={matchtype}`;

const FIRST_STEPS = [
  "Crie o cliente em Clientes e copie o slug.",
  "Cadastre as campanhas com o link do criativo (opcional).",
  "Copie o link gerado e use como URL final nos anuncios.",
  "Quando o lead chegar, mova o card no Kanban conforme o status.",
  "Acompanhe resultados em Performance, Relatorio e Criativos."
];

const CREATE_CAMPAIGN_STEPS = [
  "Acesse Clientes e escolha o cliente.",
  "Role ate o card \"Links de campanha\".",
  "Clique em Nova campanha.",
  "Preencha nome, slug e mensagem padrao do WhatsApp.",
  "Adicione o link do criativo no campo URL do criativo (opcional).",
  "Copie o link gerado e use no gerenciador de anuncios."
];


const KANBAN_STAGES = [
  { name: "Novo lead",        color: "#6b7280", desc: "Lead acabou de chegar pelo WhatsApp." },
  { name: "Em atendimento",   color: "#3b82f6", desc: "Sendo contactado pela equipe." },
  { name: "Agendado",         color: "#8b5cf6", desc: "Consulta ou reuniao marcada. Melhora a taxa de agendamento." },
  { name: "Compareceu",       color: "#f59e0b", desc: "Lead apareceu no atendimento. Melhora a taxa de comparecimento." },
  { name: "Negociacao",       color: "#ec4899", desc: "Em negociacao ativa, proximo de fechar." },
  { name: "Pago",             color: "#22c55e", desc: "Venda realizada. Registre o valor para calcular o ROAS." },
  { name: "Finalizado",       color: "#15803d", desc: "Atendimento concluido com sucesso." },
  { name: "Perdido",          color: "#ef4444", desc: "Lead desistiu ou nao respondeu." }
];

const RESULTS = [
  {
    icon: "📊",
    title: "Performance",
    desc: "Visao geral de leads, agendamentos e vendas por campanha, sem filtro de data."
  },
  {
    icon: "📋",
    title: "Relatorio",
    desc: "Investimento, CPL, ROAS e faturamento por periodo e campanha. Ideal para comparar meses."
  },
  {
    icon: "📤",
    title: "Exportar",
    desc: "Gera lista de leads para criar Publicos Personalizados e Lookalike no Meta Ads."
  },
  {
    icon: "💡",
    title: "Criativos",
    desc: "Ranking de criativos por vendas, agendamentos e leads. Mostra o que escalar."
  }
];

export default async function AcademyPage() {
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
            <span className="dashboard-eyebrow">Guia</span>
            <h2>Como usar o sistema</h2>
            <p>
              Passo a passo para configurar campanhas, rastrear leads e interpretar resultados.
            </p>
          </div>
        </header>

        {/* Primeiros passos */}
        <div className="dashboard-section-divider"><span>Primeiros passos</span></div>
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Por onde comecar</h3>
          </div>
          <ol className="guide-steps">
            {FIRST_STEPS.map((step, i) => (
              <li key={i} className="guide-step">
                <span className="guide-step__num">{i + 1}</span>
                <span className="guide-step__text">{step}</span>
              </li>
            ))}
          </ol>
        </article>

        {/* Campanhas */}
        <div className="dashboard-section-divider"><span>Campanhas</span></div>
        <div className="dashboard-detail-grid">

          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <h3>Como criar uma campanha</h3>
            </div>
            <ol className="guide-steps">
              {CREATE_CAMPAIGN_STEPS.map((step, i) => (
                <li key={i} className="guide-step">
                  <span className="guide-step__num">{i + 1}</span>
                  <span className="guide-step__text">{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <h3>Padrao de nomenclatura</h3>
            </div>
            <div className="guide-naming-list">

              <div className="guide-naming-group">
                <div className="guide-naming-label">Campanha</div>
                <div className="guide-naming-desc">Nome + data</div>
                <div className="guide-naming-examples">
                  <span className="guide-naming-ok">Vasinhos — 03/10</span>
                  <span className="guide-naming-ok">Preenchimento — 03/10</span>
                </div>
              </div>

              <div className="guide-naming-group">
                <div className="guide-naming-label">Conjunto de anuncios</div>
                <div className="guide-naming-desc">Indica publico ou estrategia</div>
                <div className="guide-naming-examples">
                  <span className="guide-naming-ok">Mulheres 30+ - Interesse estetica</span>
                  <span className="guide-naming-ok">Lookalike 1%</span>
                  <span className="guide-naming-ok">Aberto</span>
                </div>
              </div>

              <div className="guide-naming-group">
                <div className="guide-naming-label">Criativo</div>
                <div className="guide-naming-desc">Descreve o que aparece no anuncio</div>
                <div className="guide-naming-examples guide-naming-examples--row">
                  <span className="guide-naming-bad">Criativo 1</span>
                  <span className="guide-naming-bad">Criativo 2</span>
                </div>
                <div className="guide-naming-examples">
                  <span className="guide-naming-ok">Video depoimento</span>
                  <span className="guide-naming-ok">Antes e depois</span>
                  <span className="guide-naming-ok">Especialista falando</span>
                  <span className="guide-naming-ok">Oferta direta</span>
                </div>
                <div className="guide-tip">
                  Use o botao &ldquo;Ver criativo&rdquo; na tela de Criativos para visualizar o anuncio rapidamente.
                </div>
              </div>

            </div>
          </article>

        </div>

        {/* Plataformas */}
        <div className="dashboard-section-divider"><span>Plataformas</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Como configurar campanha no Meta Ads</h3>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Antes de criar a campanha, configure o <strong>Pixel da Meta</strong> e a <strong>API de Conversoes (CAPI)</strong>.</div>
                <div className="guide-step__sub">
                  O Pixel e a CAPI garantem que as conversoes sejam rastreadas corretamente, mesmo quando o iOS ou um adblocker bloqueia o rastreamento pelo navegador.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Crie a campanha no Gerenciador de Anuncios.</div>
                <div className="guide-step__sub">
                  Tipo de compra: <strong>Leilao</strong> &nbsp;·&nbsp; Objetivo:{" "}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "1px 8px", fontSize: "0.82rem", fontWeight: 600, color: "#1d4ed8" }}>
                    Leads
                  </span>
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Configure a conversao no nivel da campanha:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 160 }}>Local da conversao:</span>
                    <strong>Site</strong>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 160 }}>Meta de desempenho:</span>
                    <strong>Maximizar o numero de conversoes</strong>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 160 }}>Evento de conversao:</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "1px 8px", fontSize: "0.82rem", fontWeight: 600, color: "#15803d" }}>
                      Lead
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 160 }}>Conjunto de dados (Pixel):</span>
                    <strong>Selecione o Pixel correto da conta</strong>
                  </div>
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div>
                  No campo <strong>&ldquo;URL do site&rdquo;</strong>, cole o link gerado pelo Zap Faturamento.
                </div>
                <div className="guide-step__sub">
                  Use o link gerado pelo sistema — ele ja inclui todas as UTMs para rastreamento correto. Nao e necessario adicionar parametros manualmente.
                </div>
              </div>
            </li>
          </ol>
          <div className="guide-tip guide-tip--info" style={{ marginTop: 12 }}>
            <strong>Sobre as UTMs:</strong> O link gerado pelo Zap Faturamento ja inclui todos os parametros de rastreamento (utm_campaign, utm_content, utm_term, campaign_id, etc.). Nao duplique adicionando UTMs manualmente nos campos da Meta.
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="dashboard-table__sub" style={{ marginBottom: 4 }}>Exemplo do link ja configurado automaticamente</div>
            <div className="guide-step__sub" style={{ marginBottom: 8 }}>
              Este link ja inclui UTMs para rastreamento. Basta copiar e colar no campo URL do site.
            </div>
            <code className="dashboard-code-block">{metaLink}</code>
            <CopyButton value={metaLink} label="Copiar link Meta" />
          </div>
        </article>

        <div className="dashboard-detail-grid" style={{ marginTop: 0 }}>

          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <h3>Google Ads — Sem landing page</h3>
            </div>
            <p className="dashboard-helper">
              Anuncio aponta direto para o WhatsApp, sem pagina intermediaria.
            </p>
            <ol className="guide-steps">
              <li className="guide-step">
                <span className="guide-step__num">1</span>
                <span className="guide-step__text">Crie a campanha normalmente no Google Ads.</span>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">2</span>
                <span className="guide-step__text">No campo <strong>URL final</strong>, cole o link do Zap Faturamento com UTMs.</span>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">3</span>
                <span className="guide-step__text">As UTMs ja estao incluidas no link — nao e necessario adicionar manualmente.</span>
              </li>
            </ol>
            <div style={{ marginTop: 12 }}>
              <code className="dashboard-code-block">{googleLink}</code>
              <CopyButton value={googleLink} label="Copiar link Google" />
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <h3>Google Ads — Com landing page</h3>
            </div>
            <p className="dashboard-helper">
              Anuncio aponta para uma landing page; o botao da landing leva ao WhatsApp.
            </p>
            <ol className="guide-steps">
              <li className="guide-step">
                <span className="guide-step__num">1</span>
                <span className="guide-step__text">O anuncio aponta para a <strong>landing page</strong>.</span>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">2</span>
                <span className="guide-step__text">O botao &ldquo;Falar no WhatsApp&rdquo; da landing deve usar o <strong>link do Zap Faturamento</strong>.</span>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">3</span>
                <span className="guide-step__text">Certifique-se de que as UTMs do Google estao no link do botao do WhatsApp.</span>
              </li>
            </ol>
            <div className="guide-tip guide-tip--warn" style={{ marginTop: 12 }}>
              Sem as UTMs no link do botao, o lead aparece como direto e perde a referencia da campanha.
            </div>
          </article>

        </div>

        {/* Google Ads — Rastreamento */}
        <article className="dashboard-card" style={{ marginTop: 0, border: "1px solid #bfdbfe" }}>
          <div className="dashboard-card__header">
            <div>
              <h3>Google Ads — Rastreamento de leads</h3>
              <p className="dashboard-helper" style={{ marginBottom: 0 }}>
                Configure Google Analytics, Tag Manager e conversao para campanhas com landing page.
              </p>
            </div>
            <a
              href="/dashboard/academia/google-ads"
              className="dashboard-button"
              style={{ textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Ver guia completo
            </a>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {["Sem site: nao precisa de Tag Manager", "Com site: precisa de GTM + Analytics", "Passo critico: marcar evento como conversao no GA4"].map((tip) => (
              <span key={tip} style={{ fontSize: "0.78rem", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: 6, padding: "2px 10px" }}>
                {tip}
              </span>
            ))}
          </div>
        </article>

        {/* Kanban */}
        <div className="dashboard-section-divider"><span>Kanban</span></div>
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Como usar o Kanban</h3>
          </div>
          <p className="dashboard-helper">
            Mover os cards corretamente alimenta os relatorios, exportacoes e a inteligencia de criativos.
          </p>
          <div className="guide-kanban-grid">
            {KANBAN_STAGES.map((s) => (
              <div key={s.name} className="guide-kanban-stage">
                <div className="guide-kanban-stage__name" style={{ borderLeftColor: s.color }}>
                  {s.name}
                </div>
                <div className="guide-kanban-stage__desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </article>

        {/* Resultados */}
        <div className="dashboard-section-divider"><span>Analise de resultados</span></div>
        <div className="guide-results-grid">
          {RESULTS.map((r) => (
            <article key={r.title} className="guide-result-card">
              <div className="guide-result-card__icon">{r.icon}</div>
              <div className="guide-result-card__body">
                <strong>{r.title}</strong>
                <p>{r.desc}</p>
              </div>
            </article>
          ))}
        </div>

      </section>
    </main>
  );
}
