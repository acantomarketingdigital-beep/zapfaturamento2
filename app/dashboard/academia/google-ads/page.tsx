import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

// ─── Passos comuns (sistema injeta tudo) ───────────────────────────────────
const STEPS_SISTEMA = [
  {
    title: "Criar uma propriedade no Google Analytics 4",
    body: (
      <>
        <div>
          Acesse <strong>analytics.google.com</strong>, crie uma conta (ou use uma existente) e
          adicione uma <strong>Propriedade GA4</strong> para o cliente.
        </div>
        <div className="guide-step__sub">
          Ao terminar, copie o <strong>Measurement ID</strong> — formato{" "}
          <code>G-XXXXXXXXXX</code>. Voce vai precisar dele no Passo 4.
        </div>
      </>
    ),
  },
  {
    title: "Criar um container no Google Tag Manager",
    body: (
      <>
        <div>
          Acesse <strong>tagmanager.google.com</strong>, crie uma conta e adicione um container
          do tipo <strong>Web</strong>.
        </div>
        <div className="guide-step__sub">
          Copie o <strong>Container ID</strong> — formato <code>GTM-XXXXXXX</code>. O sistema
          vai injetar o GTM automaticamente; voce nao precisa colar codigo no site.
        </div>
      </>
    ),
  },
  {
    title: "Conectar o GA4 dentro do GTM",
    body: (
      <>
        <div>
          Dentro do GTM, crie uma <strong>Tag</strong> do tipo{" "}
          <code>Google Analytics: GA4 Configuration</code>.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="guide-step__sub" style={{ margin: 0, minWidth: 130 }}>Measurement ID:</span>
            <code>G-XXXXXXXXXX</code>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="guide-step__sub" style={{ margin: 0, minWidth: 130 }}>Trigger:</span>
            <strong>All Pages</strong>
          </div>
        </div>
        <div className="guide-step__sub" style={{ marginTop: 6 }}>
          Publique o container. Isso faz o GA4 receber os dados de navegacao.
        </div>
      </>
    ),
  },
  {
    title: "Criar uma acao de conversao no Google Ads",
    body: (
      <>
        <div>
          No Google Ads, acesse <strong>Ferramentas → Medicoes → Conversoes → + Nova conversao</strong>.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="guide-step__sub" style={{ margin: 0, minWidth: 130 }}>Categoria:</span>
            <strong>Lead</strong>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="guide-step__sub" style={{ margin: 0, minWidth: 130 }}>Origem:</span>
            <strong>Website</strong>
          </div>
        </div>
        <div className="guide-step__sub" style={{ marginTop: 6 }}>
          Ao final, copie o <strong>Conversion ID</strong> (formato <code>AW-XXXXXXXXX</code>)
          e o <strong>Conversion Label</strong>. Ambos ficam em{" "}
          <em>Configuracoes da acao de conversao → Tag de acompanhamento</em>.
        </div>
      </>
    ),
  },
  {
    title: "Cadastrar os IDs no sistema",
    body: (
      <>
        <div>
          No painel do cliente (Clientes → selecionar o cliente → Tracking adicional), preencha:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
          {[
            ["GTM ID",                "GTM-XXXXXXX"],
            ["GA4 ID",                "G-XXXXXXXXXX"],
            ["Google Ads ID",         "AW-XXXXXXXXX"],
            ["Google Ads Conv. Label","AbCdEfGhIjK"],
          ].map(([label, example]) => (
            <div key={label} style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
              <span className="guide-step__sub" style={{ margin: 0, minWidth: 200 }}>{label}:</span>
              <code style={{ fontSize: "0.78rem" }}>{example}</code>
            </div>
          ))}
        </div>
        <div className="guide-step__sub" style={{ marginTop: 6 }}>
          Salve. A partir daqui o sistema cuida de tudo — injeta o GTM, carrega o GA4 e
          dispara o evento <code>generate_lead</code> automaticamente quando o lead converte.
        </div>
      </>
    ),
  },
  {
    title: "Marcar 'generate_lead' como conversao no GA4 (CRITICO)",
    body: (
      <>
        <div>
          No GA4, va em <strong>Configurar → Eventos</strong>. Aguarde o primeiro lead chegar
          e localize o evento <code>generate_lead</code>.
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 12px", margin: "8px 0", fontSize: "0.82rem", fontWeight: 600, color: "#15803d" }}>
          ✓ Ative &quot;Marcar como evento-chave&quot;
        </div>
        <div className="guide-step__sub">
          Depois, no Google Ads va em <strong>Ferramentas → Conversoes → Importar → Google
          Analytics → generate_lead</strong> e importe como conversao primaria. O algoritmo
          do Google passa a otimizar para leads reais.
        </div>
      </>
    ),
  },
];

// ─── Passos para quem tem site proprio ─────────────────────────────────────
const STEPS_COM_SITE = [
  {
    title: "Instalar o GTM no site do cliente",
    body: (
      <>
        <div>
          Siga os passos 1, 2 e 3 acima (criar GA4, GTM e conectar). Depois instale o codigo
          do GTM manualmente no <code>&lt;head&gt;</code> e <code>&lt;body&gt;</code> do site.
        </div>
        <div className="guide-step__sub">
          O codigo e exibido pelo proprio GTM em <em>Administrador → Instalar GTM</em>.
        </div>
      </>
    ),
  },
  {
    title: "Criar a Tag de Conversao do Google Ads no GTM",
    body: (
      <>
        <div>
          Crie uma Tag do tipo <strong>Google Ads Conversion Tracking</strong> com o
          Conversion ID e Label copiados no Passo 4.
        </div>
      </>
    ),
  },
  {
    title: "Configurar o Trigger para clique no WhatsApp",
    body: (
      <>
        <div>
          Crie um Trigger <strong>Click — All Elements</strong> com a condicao:
        </div>
        <div style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="guide-step__sub" style={{ margin: 0, fontWeight: 600 }}>
            Click URL contiver:
          </div>
          <code style={{ fontSize: "0.78rem" }}>wa.me</code>
          <code style={{ fontSize: "0.78rem" }}>api.whatsapp.com</code>
        </div>
        <div className="guide-step__sub" style={{ marginTop: 6 }}>
          Associe o Trigger a Tag de conversao criada no passo anterior e publique.
        </div>
      </>
    ),
  },
  {
    title: "Marcar o evento como conversao no GA4",
    body: (
      <>
        <div>
          Siga o <strong>Passo 6</strong> descrito acima — localize <code>generate_lead</code>{" "}
          ou o evento de clique no WhatsApp e marque como evento-chave.
        </div>
      </>
    ),
  },
];

// ─── Checklist Lead Express ─────────────────────────────────────────────────
const STEPS_LEAD_EXPRESS = [
  {
    title: "Siga os Passos 1 a 5 acima",
    body: (
      <div>
        Crie o GA4, o GTM, a conversao no Google Ads e cadastre os IDs no painel.
        O Lead Express usa a mesma integracao automatica.
      </div>
    ),
  },
  {
    title: "Crie o formulario no sistema",
    body: (
      <>
        <div>
          Va em <strong>Lead Express</strong> no menu lateral e clique em{" "}
          <strong>+ Novo formulario</strong>.
        </div>
        <div className="guide-step__sub">
          Defina titulo, subtitulo, cor e quais campos opcionais aparecem (email, procedimento,
          cidade, observacao). Salve e copie o link publico gerado.
        </div>
      </>
    ),
  },
  {
    title: "Use o link do formulario no Google Ads",
    body: (
      <>
        <div>
          No Google Ads, ao criar o anuncio, cole o link do Lead Express no campo{" "}
          <strong>URL final</strong>:
        </div>
        <div style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
          <code style={{ fontSize: "0.78rem", wordBreak: "break-all" }}>
            https://zapfaturamento.com.br/f/nome-do-cliente/nome-do-form?utm_source=google&utm_medium=cpc&utm_campaign=&#123;campaignid&#125;&utm_content=&#123;adgroupid&#125;&gclid=&#123;gclid&#125;
          </code>
        </div>
        <div className="guide-step__sub" style={{ marginTop: 6 }}>
          As variaveis entre chaves <code>&#123;&#125;</code> sao preenchidas automaticamente
          pelo Google. O sistema captura tudo antes de mostrar o formulario.
        </div>
      </>
    ),
  },
  {
    title: "O que acontece quando o lead envia o formulario",
    body: (
      <>
        <div>
          Assim que o lead clica em <strong>Enviar</strong>, o sistema automaticamente:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {[
            ["Lead cadastrado", "Nome, telefone e dados aparecem no Kanban com origem Google."],
            ["generate_lead disparado", "Evento enviado ao GA4 e ao Google Ads como conversao."],
            ["UTMs preservadas", "Campanha, anuncio e gclid ficam gravados no lead."],
          ].map(([titulo, desc]) => (
            <div key={String(titulo)} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: "#15803d", fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✓</span>
              <div>
                <strong style={{ fontSize: "0.88rem" }}>{titulo}</strong>
                <div className="guide-step__sub" style={{ marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
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
            <h2>Rastreamento de leads no Google Ads</h2>
            <p>
              O sistema detecta trafego do Google automaticamente e exibe uma pagina intermediaria com conteudo real — evitando a classificacao como bridge page. Para rastreamento, escolha entre disparo direto (sem GA4) ou via GA4 + GTM.
            </p>
          </div>
        </header>

        {/* ── Smart Redirect Page ── */}
        <article className="dashboard-card" style={{ border: "2px solid #6366f1", marginBottom: 0 }}>
          <div className="dashboard-card__header">
            <div>
              <h3 style={{ color: "#4f46e5" }}>Pagina Intermediaria Google (Smart Redirect Page)</h3>
              <p className="dashboard-helper" style={{ marginBottom: 0 }}>
                Por que o sistema nao redireciona automaticamente para o WhatsApp quando o trafego vem do Google Ads.
              </p>
            </div>
          </div>

          {/* Por que existe */}
          <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
            <strong style={{ fontSize: "0.85rem", color: "#92400e" }}>O problema: pagina ponte (bridge page)</strong>
            <p className="dashboard-helper" style={{ marginTop: 6, marginBottom: 0 }}>
              Paginas que redirecionam automaticamente o usuario para outro destino (como um link do WhatsApp) sao classificadas pelo Google como <strong>bridge pages</strong> ou <strong>doorway pages</strong>. O resultado e <strong>zero impressoes</strong> — o Google para de veicular o anuncio por violacao de politica de qualidade da pagina de destino.
            </p>
          </div>

          {/* Como funciona agora */}
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
            <strong style={{ fontSize: "0.85rem", color: "#14532d" }}>Como o sistema resolve isso automaticamente</strong>
            <p className="dashboard-helper" style={{ marginTop: 6, marginBottom: 10 }}>
              Quando o sistema detecta trafego do Google (presenca de <code>gclid</code> ou <code>utm_source=google</code> na URL), em vez de redirecionar, ele exibe uma pagina com conteudo real:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {[
                ["Logo e nome do cliente", "Identidade visual da empresa no topo da pagina"],
                ["Titulo e subtitulo", 'Ex: "Fale com Clinica X pelo WhatsApp"'],
                ["3 beneficios do atendimento", "Texto que demonstra valor — nao e uma pagina vazia"],
                ["Botao de acao manual", "O lead clica para abrir o WhatsApp — sem redirecionamento automatico"],
                ["Rodape com Politica de Privacidade e Termos de Uso", "Conformidade LGPD e exigencia basica do Google Ads"],
              ].map(([item, desc]) => (
                <div key={String(item)} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "#15803d", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <div>
                    <strong style={{ fontSize: "0.85rem" }}>{item}</strong>
                    <div className="guide-step__sub" style={{ marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fluxo visual */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Fluxo por tipo de trafego</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4f46e5", marginBottom: 6 }}>Google Ads (gclid ou utm_source=google)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: "0.78rem" }}>
                  <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#1d4ed8" }}>Anuncio Google</span>
                  <span style={{ color: "var(--muted)" }}>→</span>
                  <span style={{ background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#6d28d9" }}>Pagina com conteudo (Zap)</span>
                  <span style={{ color: "var(--muted)" }}>→</span>
                  <span style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#374151" }}>Lead clica no botao</span>
                  <span style={{ color: "var(--muted)" }}>→</span>
                  <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#15803d" }}>WhatsApp</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#db2777", marginBottom: 6 }}>Meta Ads / trafego direto / organico</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: "0.78rem" }}>
                  <span style={{ background: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#be185d" }}>Anuncio Meta / Link direto</span>
                  <span style={{ color: "var(--muted)" }}>→</span>
                  <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#15803d" }}>Redireciona para WhatsApp (automatico)</span>
                </div>
              </div>

            </div>
          </div>

          {/* O que voce precisa fazer */}
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px" }}>
            <strong style={{ fontSize: "0.85rem", color: "#14532d" }}>O que voce precisa fazer no Google Ads</strong>
            <p className="dashboard-helper" style={{ marginTop: 6, marginBottom: 0 }}>
              <strong>Nada diferente.</strong> Use o mesmo link <code>/w/slug/campanha</code> com os parametros UTM normais. O sistema detecta o trafego do Google automaticamente e exibe a pagina intermediaria — voce nao precisa configurar nada adicional.
            </p>
            <div style={{ marginTop: 10, background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>URL Final no anuncio</div>
              <code style={{ fontSize: "0.78rem", wordBreak: "break-all" }}>
                https://zapfaturamento.com.br/w/cliente/campanha?utm_source=google&utm_medium=cpc&utm_campaign=&#123;campaignid&#125;&utm_content=&#123;adgroupid&#125;&gclid=&#123;gclid&#125;
              </code>
            </div>
          </div>
        </article>

        {/* ── NOVO: Sem GA4 ── */}
        <div className="dashboard-section-divider">
          <span>Nao aparece a opcao de importar do GA4? Use este metodo</span>
        </div>

        <article className="dashboard-card" style={{ border: "2px solid #16a34a" }}>
          <div className="dashboard-card__header">
            <div>
              <h3 style={{ color: "#15803d" }}>Conversao direta no Google Ads — sem GA4, sem importacao</h3>
              <p className="dashboard-helper" style={{ marginBottom: 0 }}>
                Muitas contas do Google Ads nao exibem a opcao de importar do GA4. Neste caso, use o disparo direto via tag de conversao. O sistema faz tudo automaticamente — voce so precisa dos dois codigos abaixo.
              </p>
            </div>
          </div>

          {/* Como funciona */}
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
            <strong style={{ fontSize: "0.85rem", color: "#14532d" }}>Como funciona</strong>
            <p className="dashboard-helper" style={{ marginTop: 6, marginBottom: 0 }}>
              Quando o lead clica no botao do WhatsApp (ou envia o Lead Express), o sistema dispara automaticamente o evento de conversao diretamente para o Google Ads, usando o <code>gtag</code>. Nenhuma importacao do GA4 e necessaria — o Google ja recebe o sinal de conversao na hora.
            </p>
          </div>

          {/* Passo 1 */}
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div><strong>Crie a acao de conversao no Google Ads</strong></div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="guide-step__sub">Acesse: <strong>Google Ads → Metas → Conversoes → + Nova conversao → Site</strong></div>
                  {[
                    ["Categoria", "Lead"],
                    ["Nome da conversao", "Qualquer nome, ex: Lead WhatsApp"],
                    ["Valor", "Opcional — pode deixar em branco"],
                    ["Janela de conversao", "30 dias (padrao)"],
                  ].map(([label, val]) => (
                    <div key={String(label)} style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                      <span className="guide-step__sub" style={{ margin: 0, minWidth: 180 }}>{label}:</span>
                      <strong style={{ fontSize: "0.85rem" }}>{val}</strong>
                    </div>
                  ))}
                </div>
                <div className="guide-tip" style={{ marginTop: 10 }}>
                  Ao final, clique em <strong>&ldquo;Usar a Tag do Google&rdquo;</strong> (nao &ldquo;Importar do Google Analytics&rdquo;). Va em <em>Configuracoes da acao → Tag de acompanhamento</em> e copie os dois valores abaixo.
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div><strong>Copie o Conversion ID e o Conversion Label</strong></div>
                <div style={{ marginTop: 10, background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Conversion ID</div>
                    <code style={{ fontSize: "0.88rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "3px 10px", color: "#1d4ed8" }}>AW-XXXXXXXXX</code>
                    <div className="guide-step__sub" style={{ marginTop: 4 }}>Aparece no topo do snippet de codigo como <code>gtag(&apos;config&apos;, &apos;AW-XXXXXXXXX&apos;)</code></div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Conversion Label</div>
                    <code style={{ fontSize: "0.88rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "3px 10px", color: "#15803d" }}>AbCdEfGhIjKlM</code>
                    <div className="guide-step__sub" style={{ marginTop: 4 }}>Aparece na linha <code>gtag(&apos;event&apos;, &apos;conversion&apos;, &#123; send_to: &apos;AW-xxx/<strong>AbCdEfGhIjKlM</strong>&apos; &#125;)</code></div>
                  </div>
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div><strong>Cadastre os dois codigos no painel do cliente</strong></div>
                <div style={{ marginTop: 8 }}>
                  <div className="guide-step__sub">Acesse: <strong>Clientes → selecione o cliente → Editar → secao Rastreamento</strong></div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      ["Google Ads ID", "AW-XXXXXXXXX", "#eff6ff", "#bfdbfe", "#1d4ed8", "O Conversion ID que voce copiou acima"],
                      ["Google Ads Conversion Label", "AbCdEfGhIjKlM", "#f0fdf4", "#bbf7d0", "#15803d", "O Conversion Label que voce copiou acima"],
                    ].map(([label, example, bg, border, color, desc]) => (
                      <div key={String(label)} style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.85rem", minWidth: 230 }}>{label}:</span>
                          <code style={{ fontSize: "0.82rem", background: String(bg), border: `1px solid ${String(border)}`, borderRadius: 5, padding: "2px 10px", color: String(color) }}>{example}</code>
                        </div>
                        <div className="guide-step__sub" style={{ marginTop: 4 }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px" }}>
                  <strong style={{ fontSize: "0.85rem", color: "#14532d" }}>Pronto.</strong>
                  <span className="guide-step__sub" style={{ marginLeft: 6 }}>
                    A partir daqui, cada vez que um lead for capturado, o sistema dispara automaticamente o evento de conversao para o Google Ads. Nenhuma importacao do GA4 e necessaria.
                  </span>
                </div>
              </div>
            </li>
          </ol>
        </article>

        {/* ── Via GTM (alternativa) ── */}
        <article className="dashboard-card" style={{ border: "1px solid #e0e7ff" }}>
          <div className="dashboard-card__header">
            <div>
              <h3>Alternativa: conversao via GTM (sem GA4)</h3>
              <p className="dashboard-helper" style={{ marginBottom: 0 }}>
                Para quem ja usa GTM e prefere gerenciar as tags pelo container. Nao precisa de GA4 nem de importacao.
              </p>
            </div>
          </div>

          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div><strong>Cadastre o GTM ID e o Google Ads ID no painel do cliente</strong></div>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    ["GTM ID", "GTM-XXXXXXX", "O sistema injeta o GTM automaticamente na pagina de redirecionamento"],
                    ["Google Ads ID", "AW-XXXXXXXXX", "Necessario para o Conversion Linker funcionar corretamente"],
                  ].map(([label, example, desc]) => (
                    <div key={String(label)}>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                        <span className="guide-step__sub" style={{ margin: 0, minWidth: 200 }}>{label}:</span>
                        <code style={{ fontSize: "0.78rem" }}>{example}</code>
                      </div>
                      <div className="guide-step__sub" style={{ marginLeft: 0, marginTop: 2, paddingLeft: 208 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div><strong>No GTM, crie uma variavel de camada de dados para o evento</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  O sistema envia automaticamente o evento <code>whatsapp_redirect</code> ao dataLayer com todos os dados do lead. Voce pode criar variaveis para acessar cada campo:
                </div>
                <div style={{ marginTop: 8, background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Dados disponiveis no dataLayer</div>
                  {[
                    ["gclid", "ID do clique do Google — obrigatorio para atribuicao"],
                    ["google_conversion_id", "AW-XXXXXXXXX preenchido automaticamente"],
                    ["google_conversion_label", "Label preenchido automaticamente"],
                    ["utm_source", "Origem da campanha"],
                    ["utm_campaign", "Nome da campanha"],
                    ["utm_content", "Nome do criativo"],
                    ["client_slug", "Identificador do cliente"],
                  ].map(([key, desc]) => (
                    <div key={String(key)} style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                      <code style={{ fontSize: "0.78rem", minWidth: 220, flexShrink: 0 }}>{key}</code>
                      <span className="guide-step__sub" style={{ margin: 0 }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div><strong>Crie a Tag de Conversao do Google Ads no GTM</strong></div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    ["Tipo de tag", "Google Ads Conversion Tracking"],
                    ["Conversion ID", "AW-XXXXXXXXX (ou use a variavel {{DL - google_conversion_id}})"],
                    ["Conversion Label", "AbCdEfGhIjKlM (ou use a variavel {{DL - google_conversion_label}})"],
                    ["Gatilho (Trigger)", "Evento personalizado: whatsapp_redirect"],
                  ].map(([label, val]) => (
                    <div key={String(label)} style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                      <span className="guide-step__sub" style={{ margin: 0, minWidth: 180 }}>{label}:</span>
                      <strong style={{ fontSize: "0.83rem" }}>{val}</strong>
                    </div>
                  ))}
                </div>
                <div className="guide-tip" style={{ marginTop: 10 }}>
                  Adicione tambem uma tag <strong>Conversion Linker</strong> com gatilho <strong>All Pages</strong> para que o Google associe o <code>gclid</code> ao clique do anuncio corretamente.
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div><strong>Publique o container e teste</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Use o modo de <strong>Preview</strong> do GTM para confirmar que o evento <code>whatsapp_redirect</code> aparece e que a tag de conversao dispara corretamente.
                </div>
              </div>
            </li>
          </ol>
        </article>

        {/* Comparativo dos dois metodos */}
        <article className="dashboard-card">
          <div className="dashboard-card__header"><h3>Qual metodo usar?</h3></div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Situacao</th>
                  <th>Metodo recomendado</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["A conta do Google Ads nao mostra opcao de importar do GA4", "Disparo direto — preencha Google Ads ID + Conversion Label no painel"],
                  ["Conta nova, sem historico no GA4", "Disparo direto — comeca a receber conversoes imediatamente"],
                  ["Ja tem GTM configurado e prefere gerenciar la", "Via GTM — use o evento whatsapp_redirect como gatilho"],
                  ["Conta que ja importa do GA4 normalmente", "Mantenha o fluxo existente com GA4 (Passos 1-6 abaixo)"],
                  ["Quer os dois sinais (direto + GA4) ao mesmo tempo", "Configure ambos — nao ha conflito, o Google deduplica pelo gclid"],
                ].map(([sit, rec]) => (
                  <tr key={String(sit)}>
                    <td style={{ fontSize: "0.85rem" }}>{sit}</td>
                    <td style={{ fontSize: "0.85rem", color: "#15803d", fontWeight: 500 }}>{rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="dashboard-section-divider">
          <span>Fluxo com GA4 (para contas que conseguem importar)</span>
        </div>

        {/* ── 3 cenarios ── */}
        <div className="dashboard-detail-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>

          <article className="dashboard-card" style={{ borderLeft: "3px solid #22c55e" }}>
            <div className="dashboard-card__header">
              <h3>Cenario A — Link Direto</h3>
            </div>
            <p className="dashboard-helper" style={{ marginBottom: 10 }}>
              Anuncio aponta para o link do Zap Faturamento; o sistema redireciona para o WhatsApp.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 10, fontSize: "0.78rem" }}>
              <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#1d4ed8" }}>Anuncio</span>
              <span style={{ color: "var(--muted)" }}>→</span>
              <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#15803d" }}>Zap Faturamento</span>
              <span style={{ color: "var(--muted)" }}>→</span>
              <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#15803d" }}>WhatsApp</span>
            </div>
            <div className="guide-tip" style={{ margin: 0, fontSize: "0.8rem" }}>
              GTM + GA4 obrigatorios — o sistema injeta automaticamente.
            </div>
          </article>

          <article className="dashboard-card" style={{ borderLeft: "3px solid #3b82f6" }}>
            <div className="dashboard-card__header">
              <h3>Cenario B — Lead Express</h3>
            </div>
            <p className="dashboard-helper" style={{ marginBottom: 10 }}>
              Anuncio aponta para o formulario do sistema; o lead preenche e e cadastrado.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 10, fontSize: "0.78rem" }}>
              <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#1d4ed8" }}>Anuncio</span>
              <span style={{ color: "var(--muted)" }}>→</span>
              <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#1d4ed8" }}>Formulario Lead Express</span>
              <span style={{ color: "var(--muted)" }}>→</span>
              <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#15803d" }}>Lead cadastrado</span>
            </div>
            <div className="guide-tip" style={{ margin: 0, fontSize: "0.8rem" }}>
              GTM + GA4 obrigatorios — o sistema injeta automaticamente.
            </div>
          </article>

          <article className="dashboard-card" style={{ borderLeft: "3px solid #f59e0b" }}>
            <div className="dashboard-card__header">
              <h3>Cenario C — Site proprio</h3>
            </div>
            <p className="dashboard-helper" style={{ marginBottom: 10 }}>
              Anuncio vai para um site externo; o botao do site leva ao WhatsApp.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 10, fontSize: "0.78rem" }}>
              <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#1d4ed8" }}>Anuncio</span>
              <span style={{ color: "var(--muted)" }}>→</span>
              <span style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#c2410c" }}>Site</span>
              <span style={{ color: "var(--muted)" }}>→</span>
              <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "2px 8px", fontWeight: 600, color: "#15803d" }}>WhatsApp</span>
            </div>
            <div className="guide-tip guide-tip--warn" style={{ margin: 0, fontSize: "0.8rem" }}>
              Instalacao manual do GTM no site necessaria.
            </div>
          </article>

        </div>

        {/* ── Passos A e B ── */}
        <div className="dashboard-section-divider">
          <span>Cenarios A e B — Configuracao via sistema (6 passos)</span>
        </div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Instalacao e configuracao — Link Direto e Lead Express</h3>
          </div>
          <p className="dashboard-helper" style={{ marginBottom: 16 }}>
            Voce cria as contas e pega os IDs. O sistema se encarrega de injetar o GTM
            e disparar os eventos automaticamente em cada conversao.
          </p>
          <ol className="guide-steps">
            {STEPS_SISTEMA.map((step, i) => (
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

        {/* ── Alerta evento critico ── */}
        <article className="dashboard-card" style={{ border: "2px solid #f59e0b", padding: 0, overflow: "hidden" }}>
          <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <strong style={{ color: "#92400e", fontSize: "0.9rem" }}>
              Por que o Google roda cego sem essa configuracao
            </strong>
          </div>
          <div style={{ padding: 16 }}>
            <p className="dashboard-helper" style={{ marginBottom: 10 }}>
              O algoritmo do Google Ads aprende quem vira lead a partir dos dados de conversao.
              Sem o evento <code>generate_lead</code> chegando ao GA4 e ao Google Ads, a campanha
              <strong> nao tem dado nenhum para otimizar</strong> — o Google mostra o anuncio
              para qualquer pessoa, sem inteligencia.
            </p>
            <p className="dashboard-helper" style={{ margin: 0 }}>
              Com a configuracao correta, cada formulario preenchido ou clique no WhatsApp vira
              um sinal para o algoritmo aprender qual perfil de usuario converte mais e
              investir o orcamento nessas pessoas.
            </p>
          </div>
        </article>

        {/* ── Lead Express — Como usar ── */}
        <div className="dashboard-section-divider">
          <span>Cenario B — Como usar o Lead Express com Google Ads</span>
        </div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Lead Express — Formulario proprio sem landing page externa</h3>
          </div>
          <p className="dashboard-helper" style={{ marginBottom: 6 }}>
            O Lead Express e um formulario hospedado no proprio sistema. Voce nao precisa de
            site, WordPress ou ferramenta externa. Funciona como uma landing page minimalista
            — o lead preenche, o sistema registra, GTM e GA4 ja estao ativos.
          </p>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: "0.83rem", color: "#1e40af" }}>
            <strong>Vantagem sobre o link direto:</strong> o Google consegue coletar mais dados
            (tempo na pagina, comportamento) antes de redirecionar, o que melhora a qualidade
            do sinal de conversao.
          </div>
          <ol className="guide-steps">
            {STEPS_LEAD_EXPRESS.map((step, i) => (
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

        {/* ── Passos C (com site) ── */}
        <div className="dashboard-section-divider">
          <span>Cenario C — Site proprio (configuracao manual no GTM)</span>
        </div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Configuracao para quem tem landing page propria</h3>
          </div>
          <p className="dashboard-helper" style={{ marginBottom: 16 }}>
            Siga os Passos 1 a 4 do bloco anterior para criar GA4, GTM e a conversao no
            Google Ads. Depois instale e configure manualmente:
          </p>
          <ol className="guide-steps">
            {STEPS_COM_SITE.map((step, i) => (
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

        {/* ── Tabela comparativa ── */}
        <div className="dashboard-section-divider"><span>Resumo comparativo</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>O que cada cenario exige</h3>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Recurso</th>
                  <th style={{ textAlign: "center" }}>A — Link Direto</th>
                  <th style={{ textAlign: "center" }}>B — Lead Express</th>
                  <th style={{ textAlign: "center" }}>C — Com site</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Criar conta GA4",                    true,  true,  true,  ""],
                  ["Criar container GTM",                true,  true,  true,  ""],
                  ["Instalar GTM no site (codigo)",      false, false, true,  "Sistema injeta automaticamente nos cenarios A e B"],
                  ["Google Ads ID + Conversion Label",   true,  true,  true,  ""],
                  ["Cadastrar IDs no sistema",           true,  true,  false, "Nao se aplica — GTM e instalado manualmente no site"],
                  ["Marcar generate_lead no GA4",        true,  true,  true,  ""],
                  ["Leads registrados no Zap",           true,  true,  false, "Depende de integracao adicional"],
                  ["UTMs capturadas automaticamente",    true,  true,  false, "Depende de configuracao no site"],
                ].map(([label, a, b, c, obs]) => (
                  <tr key={String(label)}>
                    <td>
                      <div>{label}</div>
                      {obs ? <div style={{ fontSize: "0.74rem", color: "var(--muted)", marginTop: 2 }}>{obs}</div> : null}
                    </td>
                    {[a, b, c].map((val, i) => (
                      <td key={i} style={{ textAlign: "center" }}>
                        {val
                          ? <span style={{ color: "#15803d", fontWeight: 700 }}>✓</span>
                          : <span style={{ color: "#9ca3af" }}>—</span>
                        }
                      </td>
                    ))}
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
