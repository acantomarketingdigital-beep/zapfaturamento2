import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import SubscribePlansClient from "@/app/billing/subscribe/SubscribePlansClient";

const metrics = [
  { label: "Conversas",   value: "1.248",     growth: "+18%" },
  { label: "Faturamento", value: "R$ 48.750", growth: "+22%" },
  { label: "Leads hoje",  value: "37",        growth: "+15%" }
];

const features = [
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="22" height="22">
        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
      </svg>
    ),
    title: "Inbox e Pipeline nativos",
    text: "Leia e responda conversas do WhatsApp direto no painel, sem abrir o celular. Organize leads no funil e mova oportunidades de etapa com um clique."
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="22" height="22">
        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd"/>
      </svg>
    ),
    title: "Criativo campeão identificado",
    text: "Veja em tempo real qual anúncio, público e criativo gera mais leads e fechamentos. Pare de adivinhar — corte o que não converte e escale o que funciona."
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="22" height="22">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z"/>
      </svg>
    ),
    title: "Múltiplos WhatsApp por campanha",
    text: "Cada anúncio pode apontar para um número diferente do mesmo cliente. Implante vai pro Dr. João, estética pra Dra. Ana — tudo rastreado separadamente."
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="22" height="22">
        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"/>
      </svg>
    ),
    title: "Rastreamento que não se perde no clique",
    text: "Capture UTMs, criativos, públicos e IDs de campanha antes do usuário sair para o WhatsApp. Sem landing page, sem perda de dados — Meta CAPI + GA4 + GTM."
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="22" height="22">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
      </svg>
    ),
    title: "Kanban e operação comercial",
    text: "Transforme clique em lead, lead em atendimento e atendimento em receita. Visão clara do funil com follow-up, temperatura do lead e fechamentos registrados."
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="22" height="22">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
      </svg>
    ),
    title: "ROI e ROAS com dados reais",
    text: "Cruze investimento, leads e fechamentos para saber exatamente quanto cada campanha retorna. CPL real, ticket médio e receita por criativo em um só lugar."
  }
];

const resources = [
  "Inbox nativo (WhatsApp conectado)",
  "Pipeline de conversas",
  "Múltiplos números por campanha",
  "Criativo campeão em tempo real",
  "Filtro por cliente (multi-agência)",
  "Meta Pixel + CAPI 100%",
  "CAPI Purchase automático ao fechar lead",
  "Lead Express (formulário sem landing page)",
  "GA4 e Google Ads",
  "Google Tag Manager",
  "Kanban manual ou automático",
  "Dashboard por cliente",
  "Follow-up agendado"
];

const nolpBenefits = [
  "Sem custo com páginas e ferramentas extras",
  "Mais rápido para subir campanhas",
  "Rastreio completo via GA4 e GTM",
  "Funciona com Google Ads e Meta Ads",
  "CAPI com 100% de cobertura"
];

const integrations = [
  {
    name: "Google Ads",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    )
  },
  {
    name: "Meta Ads",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    name: "Google Tag Manager",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    name: "Google Analytics 4",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
      </svg>
    )
  }
];

const inboxFeatures = [
  { label: "Conversas do tráfego pago apenas", desc: "Sem misturar com conversas particulares" },
  { label: "Filtro por cliente", desc: "Separe Cliente 1 de Cliente 2 com um clique" },
  { label: "Pipeline por etapa", desc: "Novo Lead → Atendimento → Fechado → Ganho" },
  { label: "Lead quente marcado", desc: "🔴 Priorize quem está pronto para fechar" },
];

const agencyFeatures = [
  {
    title: "Múltiplos clientes, uma visão",
    text: "Gerencie todos os seus clientes em um único painel com visão separada por cliente no Kanban, Pipeline e Inbox."
  },
  {
    title: "Múltiplos WhatsApp por cliente",
    text: "Cadastre até 3 números por cliente. Cada campanha aponta para o número certo — implante, botox, clareamento, cada um com seu vendedor."
  },
  {
    title: "Criativo que gera mais lead",
    text: "Cruze anúncio, conjunto e criativo com os leads que vieram de cada um. Identifique o campeão e pare de gastar em criativos que não convertem."
  }
];

export default function HomePage() {
  return (
    <main className="zf-site">
      <SiteHeader />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="zf-hero">
        <div className="zf-container zf-hero__grid">
          <div className="zf-hero__content">
            <span className="zf-badge">Zap Faturamento</span>
            <h1>Do clique no anúncio ao fechamento no WhatsApp.</h1>
            <p className="zf-hero__sub">
              Rastreamento completo, inbox nativo, criativo campeão identificado e múltiplos números por campanha — tudo em um único painel.
            </p>
            <p>
              Conecte seus WhatsApps, organize leads no funil e calcule ROI, CPL e ROAS com dados reais de cada anúncio.
            </p>

            <div className="zf-hero__actions">
              <a href="/register" className="zf-button zf-button--primary">
                Começar teste grátis
              </a>
              <a href="#inbox" className="zf-button zf-button--secondary">
                Ver como funciona
              </a>
            </div>

            <div className="zf-hero__proof">
              <div>
                <strong>Sem landing page necessária</strong>
                <span>Anúncio → Link Zap → WhatsApp direto, com rastreio completo.</span>
              </div>
              <code>/w/minha-clinica/botox?utm_source=facebook&utm_medium=cpc</code>
            </div>
          </div>

          <div className="zf-hero__mockup">
            <div className="zf-dashboard-mockup">
              <div className="zf-dashboard-mockup__header">
                <div>
                  <span className="zf-dashboard-mockup__eyebrow">Atualizado agora</span>
                  <h2>Visão unificada do seu WhatsApp</h2>
                </div>
                <div className="zf-dashboard-mockup__pulse">
                  <span />
                  Online agora
                </div>
              </div>

              <div className="zf-dashboard-mockup__stats">
                {metrics.map((metric) => (
                  <article key={metric.label} className="zf-metric-card">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <em>{metric.growth}</em>
                  </article>
                ))}
              </div>

              <div className="zf-growth-card">
                <div className="zf-growth-card__top">
                  <div>
                    <span className="zf-growth-card__label">Criativo campeão</span>
                    <strong>Botox — 05/05</strong>
                  </div>
                  <span className="zf-growth-card__tag">CPL R$ 4,20</span>
                </div>

                <div className="zf-growth-chart" aria-hidden="true">
                  <span style={{ height: "32%" }} />
                  <span style={{ height: "48%" }} />
                  <span style={{ height: "41%" }} />
                  <span style={{ height: "62%" }} />
                  <span style={{ height: "58%" }} />
                  <span style={{ height: "78%" }} />
                  <span style={{ height: "96%" }} />
                </div>

                <div className="zf-growth-card__foot">
                  <div>
                    <span>Leads qualificados</span>
                    <strong>312</strong>
                  </div>
                  <div>
                    <span>Fechamentos</span>
                    <strong>49</strong>
                  </div>
                  <div>
                    <span>Ticket médio</span>
                    <strong>R$ 995</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────── */}
      <section className="zf-trust-strip">
        <div className="zf-container zf-trust-strip__inner">
          <span>Feito para agências, prestadores e operações que vendem por conversa.</span>
          <div className="zf-trust-strip__chips">
            <span>Inbox nativo</span>
            <span>Pipeline de vendas</span>
            <span>Lead Express</span>
            <span>Criativo campeão</span>
            <span>Multi WhatsApp</span>
            <span>CAPI 100%</span>
            <span>Purchase automático</span>
            <span>ROI real</span>
          </div>
        </div>
      </section>

      {/* ── INBOX & PIPELINE ─────────────────────────────────── */}
      <section id="inbox" className="zf-section">
        <div className="zf-container">
          <div className="zf-section-heading">
            <span className="zf-badge zf-badge--soft">Inbox + Pipeline</span>
            <h2>Conversas e funil de vendas direto no painel</h2>
            <p>
              Sem abrir o celular. Leia mensagens, responda leads e mova oportunidades pelo funil — tudo no mesmo sistema que rastreia seus anúncios.
            </p>
          </div>

          <div className="zf-feature-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {inboxFeatures.map((f) => (
              <article key={f.label} className="zf-feature-card" style={{ gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: "var(--brand, #0066cc)", flexShrink: 0, marginTop: 2
                  }} />
                  <h3 style={{ margin: 0, fontSize: "0.95rem" }}>{f.label}</h3>
                </div>
                <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--muted)" }}>{f.desc}</p>
              </article>
            ))}
          </div>

          {/* Pipeline stages visual */}
          <div style={{
            marginTop: 40, display: "flex", gap: 8, overflowX: "auto",
            padding: "4px 0 12px", justifyContent: "center", flexWrap: "wrap"
          }}>
            {["Novo Lead", "Primeiro Contato", "Em Atendimento", "Orçamento Enviado", "Agendamento", "Fechado ✅"].map((stage, i, arr) => (
              <div key={stage} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  padding: "8px 16px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600,
                  background: i === arr.length - 1 ? "var(--brand, #0066cc)" : "var(--surface, #f1f5f9)",
                  color: i === arr.length - 1 ? "#fff" : "var(--muted)",
                  border: "1px solid var(--border, #e2e8f0)", whiteSpace: "nowrap"
                }}>
                  {stage}
                </div>
                {i < arr.length - 1 && (
                  <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12" style={{ color: "var(--muted)", flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L10.293 8 4.646 2.354a.5.5 0 010-.708z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA AGÊNCIAS ─────────────────────────────────────── */}
      <section className="zf-section zf-section--muted">
        <div className="zf-container">
          <div className="zf-section-heading">
            <span className="zf-badge zf-badge--soft">Para Agências</span>
            <h2>Um painel para todos os seus clientes</h2>
            <p>
              Gerencie múltiplos clientes, múltiplos WhatsApps e descubra qual criativo traz mais resultado — sem planilha, sem confusão.
            </p>
          </div>

          <div className="zf-feature-grid">
            {agencyFeatures.map((f) => (
              <article key={f.title} className="zf-feature-card">
                <div className="zf-feature-card__icon" />
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>

          {/* Multi WhatsApp visual */}
          <div style={{
            marginTop: 40, background: "var(--bg, #fff)", borderRadius: 14,
            border: "1px solid var(--border, #e2e8f0)", padding: "24px 28px",
            maxWidth: 560, margin: "40px auto 0"
          }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
              Exemplo: Clínica com 3 especialidades
            </p>
            {[
              { campanha: "Campanha — Botox",    numero: "Dra. Ana · (11) 9 9999-0001", cor: "#dcfce7", border: "#86efac", text: "#166534" },
              { campanha: "Campanha — Implante", numero: "Dr. João · (11) 9 9999-0002",  cor: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
              { campanha: "Campanha — Clareamento", numero: "Dra. Carla · (11) 9 9999-0003", cor: "#fef3c7", border: "#fcd34d", text: "#92400e" },
            ].map((row) => (
              <div key={row.campanha} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", borderRadius: 8, marginBottom: 8,
                background: row.cor, border: `1px solid ${row.border}`
              }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: row.text }}>{row.campanha}</span>
                <span style={{ fontSize: "0.76rem", color: row.text, opacity: 0.85 }}>{row.numero}</span>
              </div>
            ))}
            <p style={{ fontSize: "0.72rem", color: "var(--muted)", margin: "12px 0 0", textAlign: "center" }}>
              Cada campanha rastreia separadamente. Você vê o CPL de cada número.
            </p>
          </div>
        </div>
      </section>

      {/* ── SEM LANDING PAGE ─────────────────────────────────── */}
      <section id="sem-landing-page" className="zf-section">
        <div className="zf-container zf-nolp-layout">
          <div className="zf-nolp-content">
            <span className="zf-badge zf-badge--soft">Sem Landing Page</span>
            <h2>Rode campanhas direto para o WhatsApp</h2>
            <p>
              Elimine a necessidade de landing pages. Crie links rastreáveis e acompanhe resultados usando Google Tag Manager e Google Analytics 4.
            </p>
            <ul className="zf-nolp-list">
              {nolpBenefits.map((benefit) => (
                <li key={benefit}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="zf-nolp-check" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
            <a href="/register" className="zf-button zf-button--primary">
              Começar teste grátis
            </a>
          </div>

          <div className="zf-nolp-visual">
            <div className="zf-nolp-card">
              <div className="zf-nolp-flow">
                <div className="zf-nolp-step">
                  <div className="zf-nolp-step__icon">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                      <path d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <span>Anúncio</span>
                </div>
                <svg viewBox="0 0 20 20" fill="currentColor" className="zf-nolp-arrow" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <div className="zf-nolp-step">
                  <div className="zf-nolp-step__icon zf-nolp-step__icon--brand">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Link Zap</span>
                </div>
                <svg viewBox="0 0 20 20" fill="currentColor" className="zf-nolp-arrow" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <div className="zf-nolp-step">
                  <div className="zf-nolp-step__icon zf-nolp-step__icon--green">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                  </div>
                  <span>WhatsApp</span>
                </div>
              </div>

              <code className="zf-nolp-url">
                /w/clinica/botox?utm_source=facebook&amp;ad_id=12345
              </code>

              <div className="zf-nolp-tags">
                <span>utm_source</span>
                <span>ad_id</span>
                <span>gclid</span>
                <span>GA4</span>
                <span>GTM</span>
                <span>CAPI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LEAD EXPRESS ─────────────────────────────────────── */}
      <section className="zf-section zf-section--muted">
        <div className="zf-container">
          <div className="zf-section-heading">
            <span className="zf-badge zf-badge--soft">Lead Express</span>
            <h2>Formulário de captação que recebe tráfego direto do Meta e do Google</h2>
            <p>
              Crie formulários hospedados no ZapFaturamento e aponte seus anúncios direto para eles — sem Unbounce, sem Elementor, sem ferramenta extra. O lead entra no Kanban com rastreamento completo e CAPI automático.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40, alignItems: "start" }}>
            {/* Steps */}
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 20px" }}>Como funciona</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { step: "1", label: "Crie o formulário", desc: "Configure campos, cor, logo e mensagem de sucesso em menos de 2 minutos no painel." },
                  { step: "2", label: "Copie o link", desc: "Cada formulário tem URL própria: zapfaturamento.com.br/f/clinica/botox" },
                  { step: "3", label: "Cole no anúncio", desc: "No Meta Ads ou Google Ads, use o link como destino da campanha." },
                  { step: "4", label: "Lead entra no Kanban", desc: "Nome, telefone, interesse e todos os UTMs capturados automaticamente." },
                ].map(({ step, label, desc }, i, arr) => (
                  <div key={step} style={{ display: "flex", gap: 14, paddingBottom: i < arr.length - 1 ? 0 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "var(--brand)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 800, flexShrink: 0,
                      }}>{step}</div>
                      {i < arr.length - 1 && (
                        <div style={{ width: 1, height: 28, background: "rgba(22,163,74,0.25)", margin: "4px 0" }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < arr.length - 1 ? 4 : 0, paddingTop: 3 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="lp-visual-col" style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Tráfego vindo de</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Meta Ads", "Google Ads", "Instagram", "YouTube"].map((src) => (
                  <div key={src} style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", fontSize: "0.72rem", fontWeight: 600, color: "var(--brand)" }}>{src}</div>
                ))}
              </div>
              <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--muted)" }}>↓ vai direto para</div>
              {/* Form preview */}
              <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Lead Express · Clínica Botox</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 10 }}>Interesse em Botox?</div>
                {["Nome completo", "WhatsApp", "Procedimento de interesse"].map((field) => (
                  <div key={field} style={{ height: 28, borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", marginBottom: 6, display: "flex", alignItems: "center", paddingLeft: 10 }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{field}</span>
                  </div>
                ))}
                <div style={{ height: 32, borderRadius: 7, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#fff" }}>Quero saber mais</span>
                </div>
              </div>
              <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--muted)" }}>↓ lead entra automaticamente</div>
              <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Kanban · Novo Lead</div>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem" }}>Maria Santos</div>
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--muted)", textAlign: "right", lineHeight: 1.6 }}>
                  <div>utm_source: meta</div>
                  <div>ad_id: 120483</div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 32 }}>
            {[
              { title: "Sem ferramenta externa", text: "Formulário hospedado no ZapFaturamento. Sem Unbounce, Webflow ou Elementor." },
              { title: "Rastreamento completo", text: "UTMs, ad_id e gclid capturados com cada lead automaticamente." },
              { title: "CAPI automático", text: "Evento Lead enviado para o Meta via API de Conversões sem configuração manual." },
              { title: "Funciona no Google Ads", text: "Use o link do formulário como URL de destino. Gclid capturado automaticamente." },
            ].map(({ title, text }) => (
              <div key={title} style={{ padding: "14px 16px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 10 }}>
                <div style={{ fontWeight: 700, fontSize: "0.83rem", marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: "0.77rem", color: "var(--muted)", lineHeight: 1.5 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ─────────────────────────────────────── */}
      <div className="zf-integrations-strip">
        <div className="zf-container">
          <p className="zf-integrations-label">Compatível com:</p>
          <div className="zf-integrations-row">
            {integrations.map((integration) => (
              <div key={integration.name} className="zf-integration-chip">
                <span className="zf-integration-chip__icon">{integration.icon}</span>
                {integration.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SOLUÇÕES ─────────────────────────────────────────── */}
      <section id="solucoes" className="zf-section zf-section--muted">
        <div className="zf-container">
          <div className="zf-section-heading">
            <span className="zf-badge zf-badge--soft">Soluções</span>
            <h2>Tudo que uma operação de WhatsApp precisa para crescer</h2>
            <p>
              Do rastreamento ao fechamento, com inbox nativo, múltiplos números e criativo campeão — em um único sistema.
            </p>
          </div>

          <div className="zf-feature-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {features.map((feature) => (
              <article key={feature.title} className="zf-feature-card" style={{ gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(0,102,204,0.08)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  color: "var(--brand, #0066cc)", flexShrink: 0
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ margin: 0 }}>{feature.title}</h3>
                <p style={{ margin: 0 }}>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECURSOS ─────────────────────────────────────────── */}
      <section id="recursos" className="zf-section">
        <div className="zf-container zf-resource-layout">
          <div className="zf-section-heading zf-section-heading--left">
            <span className="zf-badge zf-badge--soft">Recursos</span>
            <h2>Stack completo para quem vende por WhatsApp</h2>
            <p>
              Inbox, Pipeline, múltiplos números, CAPI com 100% de cobertura, GA4 e Kanban. Tudo pronto, sem configuração complicada.
            </p>
          </div>

          <div className="zf-resource-card">
            {resources.map((resource) => (
              <div key={resource} className="zf-resource-card__item">
                <span className="zf-resource-card__dot" />
                <strong>{resource}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPI PURCHASE ────────────────────────────────────── */}
      <section className="zf-section">
        <div className="zf-container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 52, alignItems: "center" }}>
            {/* Content */}
            <div>
              <span className="zf-badge zf-badge--soft">Meta CAPI · Público automático</span>
              <h2 style={{ marginTop: 14 }}>Lead fechado no Kanban cria público de Purchase na Meta automaticamente</h2>
              <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: 20 }}>
                Quando você marca um lead como <strong>Pago</strong> no Kanban, o ZapFaturamento dispara um evento de Purchase para a Meta via CAPI — sem pixel, sem tag manager, sem configuração manual.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Público de compradores reais criado automaticamente no Meta Ads",
                  "Lookalike de Purchase com maior precisão e escala",
                  "Campanha otimiza para quem realmente fecha — não só clica",
                  "100% via API de Conversões — funciona com iOS 14+ e bloqueadores de pixel",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.86rem", color: "var(--dark)", lineHeight: 1.5 }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, color: "var(--brand)", flexShrink: 0, marginTop: 2 }}>
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div style={{ padding: "14px 18px", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 10, fontSize: "0.82rem", color: "var(--dark)", lineHeight: 1.6 }}>
                <strong>Sem configuração:</strong> o evento é disparado automaticamente quando você arrasta o card para a coluna <em>Pago</em> no Kanban. Nenhum código, nenhum webhook manual.
              </div>
            </div>

            {/* Visual flow */}
            <div className="lp-visual-col" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Kanban card */}
              <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 10 }}>Kanban</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Maria Santos</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Botox · R$ 1.200,00</div>
                  </div>
                  <div style={{ padding: "6px 14px", borderRadius: 20, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.35)", color: "var(--brand)", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                    ✓ Marcar como Pago
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "center", fontSize: "1.3rem", color: "var(--brand)", lineHeight: 1 }}>↓</div>

              {/* CAPI event */}
              <div style={{ background: "rgba(22,163,74,0.04)", border: "1.5px solid rgba(22,163,74,0.25)", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--brand)", marginBottom: 10 }}>Meta CAPI — Evento disparado</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--dark)", lineHeight: 1.8 }}>
                  <div><span style={{ color: "var(--brand)", fontWeight: 700 }}>event_name: </span>Purchase</div>
                  <div><span style={{ color: "var(--brand)", fontWeight: 700 }}>value: </span>1200.00</div>
                  <div><span style={{ color: "var(--brand)", fontWeight: 700 }}>currency: </span>BRL</div>
                  <div><span style={{ color: "var(--brand)", fontWeight: 700 }}>phone: </span>[hash SHA256]</div>
                </div>
              </div>

              <div style={{ textAlign: "center", fontSize: "1.3rem", color: "#3b82f6", lineHeight: 1 }}>↓</div>

              {/* Meta audience */}
              <div style={{ background: "rgba(59,130,246,0.05)", border: "1.5px solid rgba(59,130,246,0.2)", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#2563eb", marginBottom: 8 }}>Meta Ads — Público atualizado</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "#1e40af" }}>Compradores · Botox 2025</div>
                    <div style={{ fontSize: "0.72rem", color: "#3b82f6", marginTop: 2 }}>Lookalike disponível em 24h</div>
                  </div>
                  <span style={{ fontSize: "1.6rem" }}>🎯</span>
                </div>
              </div>

              <p style={{ fontSize: "0.72rem", color: "var(--muted)", margin: "4px 0 0", textAlign: "center", lineHeight: 1.5 }}>
                Cada lead pago alimenta o público de Purchase na Meta.<br />Sua campanha aprende com quem realmente converte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PREÇOS ───────────────────────────────────────────── */}
      <section id="precos" className="zf-section zf-section--muted">
        <div className="zf-container">
          <div className="zf-section-heading">
            <span className="zf-badge zf-badge--soft">Preços</span>
            <h2>Planos para cada tamanho de operação</h2>
            <p>
              Todos os planos incluem o ZapFaturamento completo: CAPI, campanhas, criativos, Kanban, Pipeline, WhatsApp e Lead Express.
              Você paga pela capacidade da sua operação.
            </p>
          </div>

          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <a
              href="/register"
              className="zf-button zf-button--primary"
              style={{ fontSize: "1rem", padding: "14px 32px", borderRadius: 10 }}
            >
              Começar teste grátis por 7 dias
            </a>
            <p style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)", marginTop: 10 }}>
              Sem cartão de crédito · Acesso completo por 7 dias · Cancele quando quiser
            </p>
          </div>

          <SubscribePlansClient isLoggedIn={true} activePlan={null} />

          <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.75rem", color: "var(--muted, #64748b)" }}>
            Lead/conversa faturável é todo novo lead que entra no Kanban/Pipeline pela primeira vez.
          </p>
          <p style={{ textAlign: "center", marginTop: 6, fontSize: "0.75rem", color: "var(--muted, #64748b)" }}>
            Pagamento seguro via Stripe · Sem fidelidade · Cancele a qualquer momento
          </p>
        </div>
      </section>

      {/* ── EXPANDA / ADD-ONS ─────────────────────────────────── */}
      <section className="zf-section">
        <div className="zf-container">
          <div className="zf-section-heading">
            <h2>Expanda quando precisar</h2>
            <p>Precisa de mais formulários ou mais números de WhatsApp sem trocar de plano? Adicione recursos extras conforme sua operação cresce.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, maxWidth: 800, margin: "0 auto" }}>
            {[
              { icon: "📋", title: "Formulários extras", text: "A partir de R$10/mês por formulário Lead Express adicional." },
              { icon: "📱", title: "WhatsApps extras", text: "A partir de R$20/mês por número de WhatsApp ativo adicional." },
              { icon: "📈", title: "Leads excedentes", text: "Cobrados por uso conforme o valor por lead do seu plano. O sistema nunca bloqueia." },
              { icon: "🔒", title: "Sistema sempre ativo", text: "Excedentes não interrompem o funcionamento. Tudo continua normalmente." },
            ].map(({ icon, title, text }) => (
              <div key={title} style={{ padding: "20px", background: "var(--surface, #fff)", border: "1.5px solid var(--border, #e5e7eb)", borderRadius: 12 }}>
                <div style={{ fontSize: "1.6rem", marginBottom: 8 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", lineHeight: 1.5 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="zf-section zf-section--muted">
        <div className="zf-container" style={{ maxWidth: 760 }}>
          <div className="zf-section-heading">
            <h2>Perguntas frequentes</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                q: "As funcionalidades mudam entre os planos?",
                a: "Não. Todos os planos incluem o sistema completo. A diferença está na quantidade de clientes, leads/conversas, formulários Lead Express e WhatsApps ativos incluídos.",
              },
              {
                q: "O que conta como lead/conversa?",
                a: "Conta quando um novo lead entra no Kanban/Pipeline pela primeira vez, seja pelo WhatsApp, campanha ou formulário Lead Express. Mensagens repetidas do mesmo lead não geram nova cobrança.",
              },
              {
                q: "O que acontece se eu passar dos leads incluídos?",
                a: "O sistema continua funcionando normalmente. O excedente é calculado conforme o valor por lead do seu plano e aparece no painel de uso.",
              },
              {
                q: "Posso comprar mais formulários ou WhatsApps sem trocar de plano?",
                a: "Sim. Você pode adicionar formulários Lead Express extras e WhatsApps ativos extras conforme a necessidade da sua operação.",
              },
            ].map(({ q, a }, i, arr) => (
              <div key={q} style={{ padding: "20px 4px", borderBottom: i < arr.length - 1 ? "1px solid var(--border, #e5e7eb)" : "none" }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 8 }}>{q}</div>
                <div style={{ fontSize: "0.86rem", color: "var(--muted, #64748b)", lineHeight: 1.6 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTATO ──────────────────────────────────────────── */}
      <section id="contato" className="zf-section zf-section--footer">
        <div className="zf-container zf-footer-cta">
          <div>
            <span className="zf-badge zf-badge--soft">Comece agora</span>
            <h2>Descubra quanto seu WhatsApp está faturando de verdade.</h2>
            <p>
              Inbox nativo, múltiplos números, criativo campeão e ROI real — tudo em um sistema que cresce com sua operação.
            </p>
          </div>
          <div className="zf-footer-cta__actions">
            <a href="/register" className="zf-button zf-button--primary">
              Teste grátis por 7 dias
            </a>
            <Link href="/login" className="zf-button zf-button--ghost">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
