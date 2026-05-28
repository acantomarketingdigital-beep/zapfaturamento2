import { CopyButton } from "@/components/dashboard/CopyButton";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

const metaLink = `/w/[cliente]/[campanha]?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}`;
const googleLink = `/w/[cliente]/[campanha]?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&gclid={gclid}&device={device}&network={network}&matchtype={matchtype}`;

const KANBAN_STAGES = [
  { name: "Novo lead",        color: "#6b7280", desc: "Lead acabou de chegar pelo WhatsApp." },
  { name: "Em atendimento",   color: "#3b82f6", desc: "Sendo contactado pela equipe." },
  { name: "Agendado",         color: "#8b5cf6", desc: "Consulta ou reunião marcada. Melhora a taxa de agendamento nos relatórios." },
  { name: "Compareceu",       color: "#f59e0b", desc: "Lead apareceu no atendimento. Melhora a taxa de comparecimento." },
  { name: "Negociação",       color: "#ec4899", desc: "Em negociação ativa, próximo de fechar." },
  { name: "Pago",             color: "#22c55e", desc: "Venda realizada. Registre o valor — é usado para calcular o ROAS nos relatórios." },
  { name: "Finalizado",       color: "#15803d", desc: "Atendimento concluído com sucesso." },
  { name: "Perdido",          color: "#ef4444", desc: "Lead desistiu ou não respondeu." }
];

const RESULTS = [
  {
    icon: "📊",
    title: "Performance",
    desc: "Visão geral de leads, agendamentos e vendas por campanha, sem filtro de data."
  },
  {
    icon: "📋",
    title: "Relatório",
    desc: "Investimento, CPL, ROAS e faturamento por período e campanha. Ideal para comparar meses e mostrar resultado para o cliente."
  },
  {
    icon: "📤",
    title: "Exportar",
    desc: "Gera lista de leads para criar Públicos Personalizados e Lookalike no Meta Ads — aumenta a qualidade dos anúncios."
  },
  {
    icon: "💡",
    title: "Criativos",
    desc: "Ranking de criativos por vendas, agendamentos e leads. Mostra exatamente o que escalar."
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
                  A plataforma de pagamentos exige CPF ou CNPJ para emitir cobranças no Brasil. Sem preencher esse campo, o botão &ldquo;Assinar&rdquo; não avança.
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
                  Se escolheu PIX, a ativação é imediata após o pagamento.
                </div>
              </div>
            </li>
          </ol>
          <div className="guide-tip guide-tip--info" style={{ marginTop: 12 }}>
            <strong>Dica:</strong> O CPF/CNPJ é usado apenas para criar a cobrança — não é salvo no perfil. Se o plano não ativar em até 5 minutos após o pagamento, entre em contato com o suporte.
          </div>
        </article>

        {/* Primeiros passos */}
        <div className="dashboard-section-divider"><span>Primeiros passos</span></div>
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Por onde começar — sequência certa para não perder leads</h3>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div><strong>Crie o cliente em Clientes</strong></div>
                <div className="guide-step__sub">
                  Acesse <strong>Clientes → + Novo cliente</strong>. Preencha o nome e o slug (identificador único, ex: <code>clinica-centro</code>). O slug faz parte dos links de campanha — use apenas letras minúsculas e hífens.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div><strong>Crie pelo menos uma campanha para o cliente</strong></div>
                <div className="guide-step__sub">
                  Dentro do cliente, role até <strong>&ldquo;Links de campanha&rdquo;</strong> e clique em <strong>Nova campanha</strong>. Dê um nome, um slug e escreva a mensagem padrão do WhatsApp que o lead vai receber quando clicar.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div><strong>Copie o link gerado e use no anúncio</strong></div>
                <div className="guide-step__sub">
                  O sistema gera o link completo já com as UTMs corretas. Esse é o link que você vai colar no campo <strong>&ldquo;URL final&rdquo;</strong> do anúncio no Meta Ads ou Google Ads — não adicione UTMs manualmente.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div><strong>Quando o lead chegar, mova o card no Kanban</strong></div>
                <div className="guide-step__sub">
                  Cada lead que clicar no link vai aparecer automaticamente no Kanban. Mover o card pelas colunas (Agendado, Pago, etc.) alimenta os relatórios de resultado.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">5</span>
              <div className="guide-step__text">
                <div><strong>Acompanhe os resultados em Performance e Relatório</strong></div>
                <div className="guide-step__sub">
                  Acesse <strong>Performance</strong> para ver o resumo por campanha ou <strong>Relatório</strong> para análise por período com CPL e ROAS.
                </div>
              </div>
            </li>
          </ol>
        </article>

        {/* Campanhas */}
        <div className="dashboard-section-divider"><span>Campanhas</span></div>
        <div className="dashboard-detail-grid">

          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <h3>Como criar uma campanha — passo a passo</h3>
            </div>
            <ol className="guide-steps">
              {[
                "Acesse Clientes no menu lateral.",
                "Clique no nome do cliente desejado.",
                "Role a página até o card \"Links de campanha\".",
                "Clique em \"Nova campanha\".",
                "Preencha: nome da campanha (ex: Botox — Junho), slug (ex: botox-jun) e a mensagem padrão que abre no WhatsApp.",
                "Adicione o link do criativo no campo \"URL do criativo\" (opcional — serve para o ranking de criativos).",
                "Clique em Salvar. O link gerado aparece logo abaixo — copie e use no anúncio.",
              ].map((step, i) => (
                <li key={i} className="guide-step">
                  <span className="guide-step__num">{i + 1}</span>
                  <span className="guide-step__text">{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <h3>Como nomear campanhas, conjuntos e criativos</h3>
            </div>
            <p className="dashboard-helper">
              Nomes claros permitem identificar o que está escalando sem precisar abrir cada anúncio.
            </p>
            <div className="guide-naming-list">

              <div className="guide-naming-group">
                <div className="guide-naming-label">Campanha — nome + data</div>
                <div className="guide-naming-examples">
                  <span className="guide-naming-ok">Vasinhos — 03/10</span>
                  <span className="guide-naming-ok">Preenchimento — 03/10</span>
                </div>
              </div>

              <div className="guide-naming-group">
                <div className="guide-naming-label">Conjunto de anúncios — público ou estratégia</div>
                <div className="guide-naming-examples">
                  <span className="guide-naming-ok">Mulheres 30+ - Interesse estética</span>
                  <span className="guide-naming-ok">Lookalike 1%</span>
                  <span className="guide-naming-ok">Aberto</span>
                </div>
              </div>

              <div className="guide-naming-group">
                <div className="guide-naming-label">Criativo — descreva o que aparece no anúncio</div>
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
                  Use o botão &ldquo;Ver criativo&rdquo; na tela de Criativos para visualizar o anúncio rapidamente.
                </div>
              </div>

            </div>
          </article>

        </div>

        {/* Plataformas */}
        <div className="dashboard-section-divider"><span>Plataformas de anúncio</span></div>

        {/* Meta Ads */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Como configurar campanha no Meta Ads (Facebook e Instagram)</h3>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Antes de criar a campanha, configure o <strong>Pixel da Meta</strong> e a <strong>API de Conversões (CAPI)</strong>.</div>
                <div className="guide-step__sub">
                  O Pixel rastreia visitas. A CAPI garante que as conversões sejam registradas mesmo quando o iOS bloqueia o rastreamento pelo navegador. Configure os dois para ter dados mais completos.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>No Gerenciador de Anúncios, crie uma nova campanha.</div>
                <div className="guide-step__sub">
                  Tipo de compra: <strong>Leilão</strong> &nbsp;·&nbsp; Objetivo:{" "}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "1px 8px", fontSize: "0.82rem", fontWeight: 600, color: "#1d4ed8" }}>
                    Leads
                  </span>
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>No nível da campanha, configure a conversão:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {[
                    ["Local da conversão", "Site"],
                    ["Meta de desempenho", "Maximizar o número de conversões"],
                    ["Evento de conversão", "Lead"],
                    ["Conjunto de dados (Pixel)", "Selecione o Pixel correto da conta"],
                  ].map(([label, val]) => (
                    <div key={String(label)} style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                      <span className="guide-step__sub" style={{ margin: 0, minWidth: 220 }}>{label}:</span>
                      <strong style={{ fontSize: "0.84rem" }}>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div>
                  No campo <strong>&ldquo;URL do site&rdquo;</strong> do anúncio, cole o link gerado pelo sistema.
                </div>
                <div className="guide-step__sub">
                  O link já inclui todas as UTMs. Não adicione UTMs manualmente — isso duplicaria os dados.
                </div>
              </div>
            </li>
          </ol>
          <div className="guide-tip guide-tip--info" style={{ marginTop: 12 }}>
            <strong>Sobre as UTMs:</strong> O link gerado pelo sistema já inclui todos os parâmetros de rastreamento automaticamente. Basta copiar e colar — não precisa tocar nos campos de UTM do Gerenciador de Anúncios.
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="dashboard-table__sub" style={{ marginBottom: 4 }}>Link gerado pelo sistema (inclui UTMs automáticas)</div>
            <code className="dashboard-code-block">{metaLink}</code>
            <CopyButton value={metaLink} label="Copiar link Meta" />
          </div>
        </article>

        {/* Google Ads */}
        <div className="dashboard-detail-grid" style={{ marginTop: 0 }}>

          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <h3>Google Ads — Página intermediária (Smart Page)</h3>
                <span style={{ display: "inline-block", marginTop: 4, fontSize: "0.75rem", background: "#dcfce7", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 6, padding: "1px 8px", fontWeight: 600 }}>
                  Evita reprovação e zero impressões
                </span>
              </div>
            </div>
            <p className="dashboard-helper">
              O Google Ads proíbe páginas que redirecionam automaticamente para o WhatsApp (&ldquo;bridge pages&rdquo;). O sistema detecta tráfego do Google e exibe uma página real com conteúdo antes do WhatsApp — evitando a reprovação.
            </p>
            <ol className="guide-steps">
              <li className="guide-step">
                <span className="guide-step__num">1</span>
                <div className="guide-step__text">
                  <div>Crie a campanha no Google Ads normalmente.</div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">2</span>
                <div className="guide-step__text">
                  <div>No campo <strong>URL final</strong>, cole o link da campanha gerado pelo sistema.</div>
                  <div className="guide-step__sub">O link já inclui <code>utm_source=google</code> — isso ativa automaticamente a Smart Page para visitantes do Google.</div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">3</span>
                <span className="guide-step__text">Para rastrear conversões, siga o guia completo de rastreamento abaixo.</span>
              </li>
            </ol>
            <div style={{ marginTop: 12 }}>
              <div className="dashboard-table__sub" style={{ marginBottom: 4 }}>URL final para o Google Ads</div>
              <code className="dashboard-code-block">{googleLink}</code>
              <CopyButton value={googleLink} label="Copiar link Google" />
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <h3>Google Ads — Formulário próprio (Lead Express)</h3>
            </div>
            <p className="dashboard-helper">
              O Lead Express é um formulário hospedado no próprio sistema. O anúncio aponta para o formulário — o lead preenche, é cadastrado no Kanban e a conversão é disparada automaticamente.
            </p>
            <ol className="guide-steps">
              <li className="guide-step">
                <span className="guide-step__num">1</span>
                <span className="guide-step__text">Crie o formulário em <strong>Lead Express</strong> no menu lateral e copie o link público.</span>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">2</span>
                <span className="guide-step__text">Use esse link como <strong>URL final</strong> no Google Ads (adicione <code>?utm_source=google&utm_medium=cpc&gclid={"{gclid}"}</code>).</span>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">3</span>
                <span className="guide-step__text">Ao enviar o formulário, o sistema dispara a conversão automaticamente para o GA4 e o Google Ads.</span>
              </li>
            </ol>
            <div className="guide-tip" style={{ marginTop: 12 }}>
              Vantagem: o Google coleta mais dados de comportamento antes de converter, melhorando a otimização da campanha.
            </div>
          </article>

        </div>

        {/* Google Ads — Rastreamento */}
        <article className="dashboard-card" style={{ marginTop: 0, border: "1px solid #bfdbfe" }}>
          <div className="dashboard-card__header">
            <div>
              <h3>Google Ads — Rastreamento de conversões</h3>
              <p className="dashboard-helper" style={{ marginBottom: 0 }}>
                Duas formas: sem GA4 (mais simples, recomendado para começar) ou via GTM (para quem já usa). O guia completo explica cada clique.
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
              "Método 1 (fácil): preencha Google Ads ID + Conversion Label no cliente",
              "Método 2 (GTM): crie acionador com nome exato whatsapp_redirect",
              "Método 3 (GA4): marque generate_lead como evento-chave e importe",
              "O sistema injeta o GTM e dispara a conversão automaticamente",
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
                Envie mensagens em massa usando a API oficial do WhatsApp (Meta Cloud API) com delay automático e rastreamento de entrega.
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
            {["Por que usar a API oficial (evita banimento)", "Como obter Phone Number ID e Access Token na Meta", "Importar contatos via CSV", "Delay automático 2-3s entre mensagens", "Acompanhar entrega em tempo real"].map((tip) => (
              <span key={tip} style={{ fontSize: "0.78rem", background: "#f5f3ff", border: "1px solid #c4b5fd", color: "#6d28d9", borderRadius: 6, padding: "2px 10px" }}>
                {tip}
              </span>
            ))}
          </div>
        </article>

        {/* Kanban */}
        <div className="dashboard-section-divider"><span>Kanban — como mover os cards corretamente</span></div>
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>O que cada coluna significa</h3>
          </div>
          <p className="dashboard-helper">
            Mover os cards corretamente é o que alimenta os relatórios de resultado, exportações e a inteligência de criativos. Não pule colunas — cada etapa registra uma métrica diferente.
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
          <div className="guide-tip guide-tip--info" style={{ marginTop: 12 }}>
            <strong>Dica:</strong> Quando um lead fechar, registre o valor da venda no campo do card antes de mover para <strong>Pago</strong>. Esse valor é usado para calcular o ROAS no relatório.
          </div>
        </article>

        {/* Resultados */}
        <div className="dashboard-section-divider"><span>Análise de resultados</span></div>
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
