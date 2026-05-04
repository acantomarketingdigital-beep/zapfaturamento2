import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import SubscribePlansClient from "@/app/billing/subscribe/SubscribePlansClient";

const metrics = [
  { label: "Conversas",    value: "1.248",     growth: "+18%" },
  { label: "Faturamento",  value: "R$ 48.750", growth: "+22%" },
  { label: "Clientes",     value: "532",       growth: "+15%" }
];

const features = [
  {
    title: "Rastreamento que não se perde no clique",
    text: "Capture UTMs, criativos, públicos e IDs de campanha antes do usuário sair para o WhatsApp. Sem landing page, sem perda de dados."
  },
  {
    title: "Kanban e operação comercial no mesmo lugar",
    text: "Transforme clique em lead, lead em atendimento e atendimento em receita com visão clara do funil de vendas."
  },
  {
    title: "ROI e ROAS calculados com dados reais",
    text: "Cruze investimento, leads e fechamentos para saber exatamente quanto cada campanha está retornando de verdade."
  }
];

const resources = [
  "Meta Pixel + CAPI",
  "GA4 e Google Ads",
  "Google Tag Manager",
  "Kommo opcional",
  "Kanban manual ou automático",
  "Dashboard por cliente"
];

const nolpBenefits = [
  "Menos custo com páginas e ferramentas",
  "Mais rápido para subir campanhas",
  "Rastreio completo via GA4 e GTM",
  "Funciona com Google Ads e Meta Ads"
];

const integrations = [
  {
    name: "Google Ads",
    abbr: "G Ads",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    )
  },
  {
    name: "Meta Ads",
    abbr: "Meta",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    name: "Google Tag Manager",
    abbr: "GTM",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    name: "Google Analytics 4",
    abbr: "GA4",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
      </svg>
    )
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
            <h1>Automatize seu atendimento. Fature mais.</h1>
            <p className="zf-hero__sub">
              Crie campanhas no Meta e Google com rastreamento completo, sem precisar de landing page.
            </p>
            <p>
              Conecte seu WhatsApp, organize leads e calcule ROI, CPL e ROAS com dados reais de cada campanha.
            </p>

            <div className="zf-hero__actions">
              <a href="/register" className="zf-button zf-button--primary">
                Começar teste grátis
              </a>
              <a href="#sem-landing-page" className="zf-button zf-button--secondary">
                Como funciona
              </a>
            </div>

            <div className="zf-hero__proof">
              <div>
                <strong>Redirect + tracking + CRM</strong>
                <span>Centralize campanha, lead e venda em uma só operação.</span>
              </div>
              <code>/w/minha-clinica?utm_source=facebook&utm_medium=cpc</code>
            </div>
          </div>

          <div className="zf-hero__mockup">
            <div className="zf-dashboard-mockup">
              <div className="zf-dashboard-mockup__header">
                <div>
                  <span className="zf-dashboard-mockup__eyebrow">Revenue intelligence</span>
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
                    <span className="zf-growth-card__label">Crescimento semanal</span>
                    <strong>+27,4%</strong>
                  </div>
                  <span className="zf-growth-card__tag">ROAS em alta</span>
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
          <span>Feito para agências, prestadores e operações que vendem por conversa sem depender de landing pages.</span>
          <div className="zf-trust-strip__chips">
            <span>Rastreamento</span>
            <span>WhatsApp Direto</span>
            <span>CRM Kanban</span>
            <span>ROAS</span>
            <span>Performance</span>
          </div>
        </div>
      </section>

      {/* ── SEM LANDING PAGE ─────────────────────────────────── */}
      <section id="sem-landing-page" className="zf-section zf-section--muted">
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
                /w/minha-clinica?utm_source=facebook&amp;campaign_id=12345
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
      <section id="solucoes" className="zf-section">
        <div className="zf-container">
          <div className="zf-section-heading">
            <span className="zf-badge zf-badge--soft">Soluções</span>
            <h2>Um sistema para rastrear, organizar e provar resultado</h2>
            <p>
              O Zap Faturamento conecta o clique do anúncio ao fechamento da
              venda com rastreamento completo, CRM e relatórios de performance.
            </p>
          </div>

          <div className="zf-feature-grid">
            {features.map((feature) => (
              <article key={feature.title} className="zf-feature-card">
                <div className="zf-feature-card__icon" />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECURSOS ─────────────────────────────────────────── */}
      <section id="recursos" className="zf-section zf-section--muted">
        <div className="zf-container zf-resource-layout">
          <div className="zf-section-heading zf-section-heading--left">
            <span className="zf-badge zf-badge--soft">Recursos</span>
            <h2>Stack pronto para operações que exigem controle e performance</h2>
            <p>
              Da captura do lead ao fechamento no Kanban, tudo foi pensado para
              funcionar como produto SaaS premium com rastreamento e ROI real.
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

      {/* ── PREÇOS ───────────────────────────────────────────── */}
      <section id="precos" className="zf-section">
        <div className="zf-container">
          <div className="zf-section-heading">
            <span className="zf-badge zf-badge--soft">Preços</span>
            <h2>Plano simples, sem surpresas</h2>
            <p>Cancele quando quiser. Sem fidelidade.</p>
          </div>

          {/* Trial CTA above plans */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
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

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, maxWidth: 740, margin: "0 auto 32px" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border, #e5e7eb)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--muted, #64748b)", whiteSpace: "nowrap" }}>ou assine diretamente</span>
            <div style={{ flex: 1, height: 1, background: "var(--border, #e5e7eb)" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <SubscribePlansClient isLoggedIn={true} activePlan={null} />
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.8rem", color: "var(--muted, #64748b)" }}>
            Pagamento seguro via Stripe · Sem fidelidade · Cancele a qualquer momento
          </p>
        </div>
      </section>

      {/* ── CONTATO ──────────────────────────────────────────── */}
      <section id="contato" className="zf-section zf-section--footer">
        <div className="zf-container zf-footer-cta">
          <div>
            <span className="zf-badge zf-badge--soft">Contato</span>
            <h2>Descubra quanto seu WhatsApp está faturando de verdade.</h2>
            <p>
              Rastreamento, campanhas, ROI e performance em um único sistema
              com cara de produto pronto para crescer.
            </p>
          </div>
          <div className="zf-footer-cta__actions">
            <Link href="/login" className="zf-button zf-button--primary">
              Entrar no Zap Faturamento
            </Link>
            <a href="mailto:contato@zapfaturamento.com" className="zf-button zf-button--ghost">
              Falar com o time
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
