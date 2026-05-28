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
        activePath="/dashboard/academia"
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

        {/* Assinatura e pagamentos */}
        <div className="dashboard-section-divider"><span>Assinatura e pagamentos</span></div>
        <article className="dashboard-card" style={{ border: "1px solid #bfdbfe" }}>
          <div className="dashboard-card__header">
            <h3>Como assinar ou fazer upgrade de plano</h3>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Acesse <strong>Dashboard &rarr; Assinatura</strong> ou clique em <strong>&ldquo;Ver planos&rdquo;</strong> em qualquer aviso de limite.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>
                  Informe seu <strong>CPF ou CNPJ</strong> no campo que aparece acima dos cards de plano.
                </div>
                <div className="guide-step__sub">
                  O Asaas (nossa plataforma de pagamentos) exige CPF ou CNPJ para emitir cobranças no Brasil. Sem preencher esse campo, o botão &ldquo;Assinar&rdquo; não avança.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Escolha o plano e clique em <strong>Assinar</strong>. Você será redirecionado para a página de pagamento.</div>
                <div className="guide-step__sub">
                  Métodos aceitos: <strong>PIX</strong> (aprovação instantânea), <strong>Boleto</strong> (1-3 dias úteis) ou <strong>Cartão de crédito</strong>.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div>Após o pagamento confirmado, o plano é ativado automaticamente.</div>
                <div className="guide-step__sub">
                  O sistema recebe a confirmação em tempo real via webhook. Se escolheu PIX, a ativação é imediata após o pagamento.
                </div>
              </div>
            </li>
          </ol>
          <div className="guide-tip guide-tip--info" style={{ marginTop: 12 }}>
            <strong>Dica:</strong> O CPF/CNPJ só precisa ser informado uma vez por sessão, antes de clicar em &ldquo;Assinar&rdquo;. Não é salvo no sistema — é usado apenas para criar a cobrança no processador de pagamento.
          </div>
        </article>

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
              <div>
                <h3>Google Ads — Smart Page (link direto aprovado)</h3>
                <span style={{ display: "inline-block", marginTop: 4, fontSize: "0.75rem", background: "#dcfce7", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 6, padding: "1px 8px", fontWeight: 600 }}>
                  Recomendado para evitar reprovacao e zero impressoes
                </span>
              </div>
            </div>
            <p className="dashboard-helper">
              O Zap Faturamento detecta automaticamente o trafego do Google (via <code>gclid</code> ou <code>utm_source=google</code>) e exibe uma pagina intermediaria legitima com logo, headline e botao manual para o WhatsApp. Para Meta Ads e outros canais, o redirect automatico continua funcionando normalmente.
            </p>
            <div className="guide-tip guide-tip--info" style={{ marginBottom: 14 }}>
              <strong>Por que isso e necessario:</strong> o Google Ads proibe &ldquo;bridge pages&rdquo; — paginas que redirecionam automaticamente sem conteudo. Campanhas com redirect puro ficam com Quality Score baixo, zero impressoes ou sao reprovadas silenciosamente. A Smart Page resolve isso sem precisar de uma landing page completa.
            </div>
            <ol className="guide-steps">
              <li className="guide-step">
                <span className="guide-step__num">1</span>
                <span className="guide-step__text">Crie a campanha no Google Ads normalmente (rede de pesquisa ou display).</span>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">2</span>
                <div className="guide-step__text">
                  <div>No campo <strong>URL final</strong>, cole o link da campanha gerado pelo sistema.</div>
                  <div className="guide-step__sub">O link ja inclui <code>utm_source=google</code> — isso ativa automaticamente a Smart Page para visitantes do Google.</div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">3</span>
                <span className="guide-step__text">Cadastre o GTM ID e/ou Google Ads ID + Conversion Label no painel do cliente para rastrear conversoes corretamente.</span>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">4</span>
                <div className="guide-step__text">
                  <div>O lead ve a pagina do cliente, clica no botao verde e abre o WhatsApp.</div>
                  <div className="guide-step__sub">O sistema dispara o evento de conversao no clique, nao no carregamento da pagina — o que e o comportamento correto para o Google Ads.</div>
                </div>
              </li>
            </ol>
            <div style={{ marginTop: 12 }}>
              <div className="dashboard-table__sub" style={{ marginBottom: 4 }}>URL final para o Google Ads (inclui UTMs automaticas)</div>
              <code className="dashboard-code-block">{googleLink}</code>
              <CopyButton value={googleLink} label="Copiar link Google" />
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <h3>Google Ads — Lead Express (formulario proprio)</h3>
            </div>
            <p className="dashboard-helper">
              Anuncio aponta para o formulario do sistema. O lead preenche, e cadastrado e o Google recebe o evento de conversao.
            </p>
            <ol className="guide-steps">
              <li className="guide-step">
                <span className="guide-step__num">1</span>
                <span className="guide-step__text">Crie o formulario em <strong>Lead Express</strong> no menu lateral e copie o link publico.</span>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">2</span>
                <span className="guide-step__text">Use esse link como <strong>URL final</strong> no Google Ads (adicione <code>?utm_source=google&utm_medium=cpc&gclid={"{gclid}"}</code>).</span>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">3</span>
                <span className="guide-step__text">Ao enviar o form, o sistema dispara <code>generate_lead</code> para o GA4 e a conversao para o Google Ads automaticamente.</span>
              </li>
            </ol>
            <div className="guide-tip" style={{ marginTop: 12 }}>
              Vantagem sobre o link direto: o Google coleta mais dados de comportamento antes de converter, melhorando a otimizacao da campanha.
            </div>
          </article>

        </div>

        {/* Sitelinks Google Ads */}
        <article className="dashboard-card" style={{ marginTop: 0 }}>
          <div className="dashboard-card__header">
            <div>
              <h3>Sitelinks Google Ads</h3>
              <p className="dashboard-helper" style={{ marginBottom: 0 }}>
                Sitelinks sao links adicionais que aparecem abaixo do seu anuncio principal no Google Ads. Cada sitelink tem uma URL propria — o sistema gera automaticamente com as UTMs do Google para rastreamento correto.
              </p>
            </div>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Acesse <strong>Clientes &rarr; [cliente] &rarr; Links de campanha</strong>.</div>
                <div className="guide-step__sub">Dentro de cada campanha existe a secao &ldquo;Sitelinks Google Ads&rdquo; logo abaixo dos criativos normais.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Clique em <strong>+ Adicionar sitelink</strong> e preencha:</div>
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 140 }}>Titulo:</span>
                    <span><strong>max. 25 caracteres</strong> &mdash; aparece como link clicavel no anuncio</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 140 }}>Descricao 1 e 2:</span>
                    <span><strong>max. 35 caracteres cada</strong> &mdash; aparecem abaixo do titulo (opcional)</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 140 }}>Slug:</span>
                    <span>gerado automaticamente a partir do titulo &mdash; define a URL unica do sitelink</span>
                  </div>
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Copie a <strong>URL Final</strong> gerada para cada sitelink.</div>
                <div className="guide-step__sub">A URL ja inclui todas as UTMs do Google (<code>utm_source=google</code>, <code>gclid</code>, <code>device</code>, etc.). Use essa URL no campo &ldquo;URL Final&rdquo; do sitelink dentro do Google Ads.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div>No Google Ads, va em <strong>Recursos &rarr; Sitelinks &rarr; + Sitelink</strong>.</div>
                <div className="guide-step__sub">Cole o Titulo, as descricoes e a URL Final gerada pelo sistema. Repita para cada sitelink criado (limite de 6 por campanha).</div>
              </div>
            </li>
          </ol>
          <div className="guide-tip guide-tip--info" style={{ marginTop: 12 }}>
            <strong>Exemplo de sitelinks uteis:</strong> &ldquo;Entre em contato&rdquo; &middot; &ldquo;Ver servicos&rdquo; &middot; &ldquo;Agendar consulta&rdquo; &middot; &ldquo;Como funciona&rdquo; &mdash; cada um gera uma URL diferente com tracking individual, entao voce ve qual sitelink gerou mais cliques e leads.
          </div>
        </article>

        {/* Google Ads — Rastreamento */}
        <article className="dashboard-card" style={{ marginTop: 0, border: "1px solid #bfdbfe" }}>
          <div className="dashboard-card__header">
            <div>
              <h3>Google Ads — Rastreamento de conversoes</h3>
              <p className="dashboard-helper" style={{ marginBottom: 0 }}>
                Duas abordagens: com GA4 (importacao) ou sem GA4 (disparo direto com Conversion ID + Label). A segunda funciona mesmo quando a conta nao exibe a opcao de importar do GA4.
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
            {[
              "Sem GA4: preencha Google Ads ID + Conversion Label no cliente",
              "Via GTM: evento whatsapp_redirect ja esta no dataLayer",
              "Com GA4: marque generate_lead como evento-chave e importe",
              "O sistema injeta GTM e dispara a conversao automaticamente",
            ].map((tip) => (
              <span key={tip} style={{ fontSize: "0.78rem", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: 6, padding: "2px 10px" }}>
                {tip}
              </span>
            ))}
          </div>
        </article>

        {/* Disparos em Massa */}
        <article className="dashboard-card" style={{ marginTop: 0, border: "1px solid #c4b5fd" }}>
          <div className="dashboard-card__header">
            <div>
              <h3>Disparos em Massa via WhatsApp Oficial</h3>
              <p className="dashboard-helper" style={{ marginBottom: 0 }}>
                Envie mensagens em massa usando a Meta Cloud API com delay automatico, rastreamento de entrega e historico completo.
              </p>
            </div>
            <a
              href="/dashboard/academia/disparos"
              className="dashboard-button"
              style={{ textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Ver guia completo
            </a>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {["Por que usar a API oficial", "Como obter Phone Number ID e Access Token", "Importar contatos via CSV", "Delay automatico 2-3s entre mensagens", "Acompanhar entrega em tempo real"].map((tip) => (
              <span key={tip} style={{ fontSize: "0.78rem", background: "#f5f3ff", border: "1px solid #c4b5fd", color: "#6d28d9", borderRadius: 6, padding: "2px 10px" }}>
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
