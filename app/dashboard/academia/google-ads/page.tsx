import { CopyButton } from "@/components/dashboard/CopyButton";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

const UTM_PASSTHROUGH_SCRIPT = `<script>
(function() {
  var params = window.location.search;
  if (!params) return;
  document.querySelectorAll('a[href*="/w/"]').forEach(function(a) {
    var sep = a.href.includes('?') ? '&' : '?';
    a.href = a.href + sep + params.slice(1);
  });
})();
</script>`;

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
            <h2>Google Ads — Rastreamento de leads</h2>
            <p>
              Guia completo passo a passo para quem nunca configurou rastreamento antes. Cada clique explicado.
            </p>
          </div>
        </header>

        {/* Visão geral */}
        <article className="dashboard-card" style={{ border: "1px solid #bfdbfe", background: "#f0f7ff" }}>
          <div className="dashboard-card__header">
            <h3 style={{ color: "#1d4ed8" }}>Antes de começar — entenda o que você vai fazer</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                icon: "🎯",
                title: "Por que preciso configurar rastreamento?",
                desc: "Sem rastreamento, o Google não sabe quem virou lead. A campanha fica rodando 'no escuro', mostrando anúncio para qualquer pessoa sem aprender. Com o rastreamento, o Google aprende quem clicou E virou lead — e passa a mostrar o anúncio para mais pessoas parecidas.",
              },
              {
                icon: "🛣️",
                title: "Qual caminho seguir?",
                desc: "Se você nunca configurou nada: use o Método 1 abaixo (mais simples, 3 passos). Se já tem o GTM instalado e quer mais controle: use o Método 2. Ambos funcionam — escolha um só.",
              },
            ].map((item) => (
              <div key={item.icon} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", borderRadius: 8, padding: "12px 14px", border: "1px solid #bfdbfe" }}>
                <span style={{ fontSize: "1.3rem", flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e3a5f", marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Página Intermediária Google */}
        <div className="dashboard-section-divider"><span>Como funciona o link do Google Ads</span></div>

        <article className="dashboard-card" style={{ border: "2px solid #6366f1" }}>
          <div className="dashboard-card__header">
            <h3 style={{ color: "#4f46e5" }}>Por que aparece uma página antes do WhatsApp no Google Ads?</h3>
          </div>

          <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
            <strong style={{ color: "#92400e", display: "block", marginBottom: 6 }}>⚠️ O problema com redirect direto</strong>
            <p style={{ fontSize: "0.84rem", color: "#78350f", lineHeight: 1.6, margin: 0 }}>
              O Google Ads proíbe páginas que redirecionam automaticamente o usuário para outro site (como um link do WhatsApp). Essas páginas são chamadas de <strong>&ldquo;bridge pages&rdquo;</strong>. O resultado: a campanha vai para <strong>zero impressões</strong> — o Google para de mostrar o anúncio sem avisar.
            </p>
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
            <strong style={{ color: "#14532d", display: "block", marginBottom: 6 }}>✅ Como o sistema resolve isso automaticamente</strong>
            <p style={{ fontSize: "0.84rem", color: "#166534", lineHeight: 1.6, marginBottom: 10 }}>
              Quando alguém clica no seu anúncio do Google, o sistema detecta que o tráfego é do Google e, em vez de redirecionar, exibe uma página real com conteúdo:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "Logo e nome do cliente",
                "Título e subtítulo da oferta",
                "3 benefícios do atendimento",
                "Botão verde para o lead clicar e abrir o WhatsApp (manual, não automático)",
                "Rodapé com Política de Privacidade — exigência do Google",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: 8, fontSize: "0.83rem" }}>
                  <span style={{ color: "#15803d", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Como o lead percorre o caminho</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4f46e5", marginBottom: 6 }}>Quando vem do Google Ads (tem gclid ou utm_source=google na URL)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: "0.78rem" }}>
                  <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "3px 10px", fontWeight: 600, color: "#1d4ed8" }}>Anúncio Google</span>
                  <span style={{ color: "#9ca3af" }}>→</span>
                  <span style={{ background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 5, padding: "3px 10px", fontWeight: 600, color: "#6d28d9" }}>Página com conteúdo real</span>
                  <span style={{ color: "#9ca3af" }}>→</span>
                  <span style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 5, padding: "3px 10px", fontWeight: 600, color: "#374151" }}>Lead clica no botão</span>
                  <span style={{ color: "#9ca3af" }}>→</span>
                  <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "3px 10px", fontWeight: 600, color: "#15803d" }}>WhatsApp</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#db2777", marginBottom: 6 }}>Quando vem do Meta Ads, Instagram ou link direto</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: "0.78rem" }}>
                  <span style={{ background: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: 5, padding: "3px 10px", fontWeight: 600, color: "#be185d" }}>Anúncio Meta / Link direto</span>
                  <span style={{ color: "#9ca3af" }}>→</span>
                  <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "3px 10px", fontWeight: 600, color: "#15803d" }}>Redireciona direto para WhatsApp</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginTop: 4 }}>
            <strong style={{ color: "#14532d", fontSize: "0.85rem" }}>O que você precisa fazer?</strong>
            <p style={{ fontSize: "0.83rem", color: "#166534", lineHeight: 1.6, margin: "6px 0 0" }}>
              <strong>Nada diferente.</strong> Use o link do sistema normalmente. Ele detecta o tráfego do Google automaticamente e exibe a página intermediária. Você não precisa criar landing page nem configurar nada extra.
            </p>
          </div>
        </article>

        {/* MÉTODO 1 — Sem GA4, direto */}
        <div className="dashboard-section-divider">
          <span>Método 1 — O mais simples (recomendado para começar)</span>
        </div>

        <article className="dashboard-card" style={{ border: "2px solid #16a34a" }}>
          <div className="dashboard-card__header">
            <div>
              <h3 style={{ color: "#15803d" }}>Conversão direta — sem GA4, sem GTM, 3 passos</h3>
              <p className="dashboard-helper" style={{ marginBottom: 0 }}>
                O sistema dispara a conversão diretamente para o Google Ads quando o lead clica no WhatsApp. Você só precisa de dois códigos.
              </p>
            </div>
          </div>

          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div><strong>Crie uma ação de conversão no Google Ads</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  No Google Ads, acesse o menu: <strong>Metas → Conversões → + Nova conversão → Site</strong>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10, background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                  {[
                    ["Categoria", "Lead"],
                    ["Nome da conversão", "Lead WhatsApp (ou qualquer nome)"],
                    ["Valor", "Deixe em branco ou coloque 0"],
                    ["Janela de conversão", "30 dias"],
                  ].map(([label, val]) => (
                    <div key={String(label)} style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.78rem", color: "#6b7280", minWidth: 180 }}>{label}:</span>
                      <strong style={{ fontSize: "0.84rem" }}>{val}</strong>
                    </div>
                  ))}
                </div>
                <div className="guide-tip" style={{ marginTop: 10 }}>
                  Ao terminar de criar, clique em <strong>&ldquo;Usar a Tag do Google&rdquo;</strong> (não &ldquo;Importar do Google Analytics&rdquo;). Depois acesse <em>Configurações da ação → Tag de acompanhamento</em> para copiar os códigos.
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div><strong>Copie o Conversion ID e o Conversion Label</strong></div>
                <p className="guide-step__sub" style={{ marginTop: 6 }}>
                  Você vai ver um bloco de código parecido com esse. Identifique os dois valores:
                </p>
                <div style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Conversion ID (ID de conversão)</div>
                    <code style={{ fontSize: "0.88rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "3px 10px", color: "#1d4ed8" }}>AW-1234567890</code>
                    <div className="guide-step__sub" style={{ marginTop: 4 }}>Aparece como <code>gtag(&apos;config&apos;, &apos;AW-1234567890&apos;)</code> — os números após AW-</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Conversion Label (Rótulo de conversão)</div>
                    <code style={{ fontSize: "0.88rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, padding: "3px 10px", color: "#15803d" }}>AbCdEfGhIjKlM</code>
                    <div className="guide-step__sub" style={{ marginTop: 4 }}>Aparece na linha <code>send_to: &apos;AW-xxx/<strong>AbCdEfGhIjKlM</strong>&apos;</code> — o que está depois da barra /</div>
                  </div>
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div><strong>Cole os dois códigos no painel do cliente</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  No sistema: <strong>Clientes → clique no cliente → Editar → seção &ldquo;Rastreamento&rdquo;</strong>
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["Google Ads ID", "AW-1234567890", "#eff6ff", "#bfdbfe", "#1d4ed8", "O Conversion ID que você copiou (começa com AW-)"],
                    ["Google Ads Conversion Label", "AbCdEfGhIjKlM", "#f0fdf4", "#bbf7d0", "#15803d", "O Conversion Label que você copiou (letras e números após a barra)"],
                  ].map(([label, example, bg, border, color, desc]) => (
                    <div key={String(label)} style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem", minWidth: 240 }}>{label}:</span>
                        <code style={{ fontSize: "0.82rem", background: String(bg), border: `1px solid ${String(border)}`, borderRadius: 5, padding: "2px 10px", color: String(color) }}>{example}</code>
                      </div>
                      <div className="guide-step__sub" style={{ marginTop: 4 }}>{desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 14px", marginTop: 12 }}>
                  <strong style={{ color: "#14532d", fontSize: "0.88rem" }}>✅ Pronto! Configuração concluída.</strong>
                  <p style={{ fontSize: "0.82rem", color: "#166534", margin: "6px 0 0", lineHeight: 1.6 }}>
                    A partir de agora, cada vez que um lead clicar no botão do WhatsApp, o sistema envia automaticamente o sinal de conversão para o Google Ads. Sem precisar de GA4, sem precisar de GTM.
                  </p>
                </div>
              </div>
            </li>
          </ol>
        </article>

        {/* MÉTODO 2 — Via GTM */}
        <div className="dashboard-section-divider">
          <span>Método 2 — Via GTM (para quem já usa ou quer mais controle)</span>
        </div>

        <article className="dashboard-card" style={{ border: "1px solid #e0e7ff" }}>
          <div className="dashboard-card__header">
            <div>
              <h3>Conversão via GTM — passo a passo completo</h3>
              <p className="dashboard-helper" style={{ marginBottom: 0 }}>
                Ideal para quem já tem o Google Tag Manager instalado. Você cria um acionador e uma tag no GTM, e o sistema dispara o evento automaticamente.
              </p>
            </div>
          </div>

          {/* O que é GTM */}
          <div style={{ background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <strong style={{ color: "#5b21b6", display: "block", marginBottom: 6 }}>O que é o Google Tag Manager (GTM)?</strong>
            <p style={{ fontSize: "0.83rem", color: "#374151", lineHeight: 1.6, margin: 0 }}>
              O GTM é um painel onde você instala &ldquo;scripts&rdquo; no seu site sem precisar mexer no código. Pense nele como uma caixa de ferramentas: você adiciona ferramentas (tags) e define quando cada uma deve ser ativada (acionadores). O sistema já envia um sinal chamado <code>whatsapp_redirect</code> quando o lead clica — você só precisa criar a tag que captura esse sinal e manda para o Google Ads.
            </p>
          </div>

          <ol className="guide-steps">
            {/* PASSO 1 */}
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div><strong>Cadastre o GTM ID e o Google Ads ID no painel do cliente</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Em <strong>Clientes → cliente → Editar → Rastreamento</strong>, preencha:
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    ["GTM ID", "GTM-XXXXXXX", "O ID do seu container do Google Tag Manager (começa com GTM-)"],
                    ["Google Ads ID", "AW-XXXXXXXXX", "O Conversion ID do Google Ads (começa com AW-) — necessário para o Linker funcionar"],
                  ].map(([label, example, desc]) => (
                    <div key={String(label)} style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem", minWidth: 180 }}>{label}:</span>
                        <code style={{ fontSize: "0.82rem" }}>{example}</code>
                      </div>
                      <div className="guide-step__sub" style={{ marginTop: 4 }}>{desc}</div>
                    </div>
                  ))}
                </div>
                <div className="guide-step__sub" style={{ marginTop: 8 }}>
                  Salve. O sistema vai injetar o GTM automaticamente em cada visita — você não precisa instalar código no site.
                </div>
              </div>
            </li>

            {/* PASSO 2 — CRÍTICO: criar acionador */}
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div><strong>Crie o Acionador no GTM — este passo é crítico</strong></div>
                <p className="guide-step__sub" style={{ marginTop: 6 }}>
                  Acesse <strong>tagmanager.google.com</strong>, abra seu container e siga exatamente os passos abaixo:
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {[
                    { num: "a", text: "No menu esquerdo, clique em", bold: "Acionadores" },
                    { num: "b", text: "Clique no botão azul", bold: "Novo" },
                    { num: "c", text: "Clique no bloco cinza no meio da tela para escolher o tipo do acionador" },
                    { num: "d", text: "Na lista que aparecer, procure e clique em", bold: "Evento Personalizado" },
                  ].map((item) => (
                    <div key={item.num} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 12px" }}>
                      <span style={{ background: "#6366f1", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{item.num}</span>
                      <span style={{ fontSize: "0.83rem" }}>
                        {item.text}{item.bold ? <> <strong>&ldquo;{item.bold}&rdquo;</strong></> : null}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CAMPO CRÍTICO */}
                <div style={{ background: "#fffbeb", border: "2px solid #f59e0b", borderRadius: 8, padding: "14px 16px", marginTop: 14 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                    <strong style={{ color: "#92400e", fontSize: "0.88rem" }}>Campo crítico — copie exatamente como está</strong>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>No campo &ldquo;Nome do evento&rdquo;, digite:</div>
                    <code style={{ fontSize: "1.1rem", fontWeight: 700, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, padding: "6px 14px", color: "#92400e", letterSpacing: "0.03em" }}>whatsapp_redirect</code>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.82rem", color: "#78350f" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>✗</span>
                      <span>NÃO use hífen: <code>whatsapp-redirect</code> ← errado</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>✗</span>
                      <span>NÃO coloque espaço: <code>whatsapp redirect</code> ← errado</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>✗</span>
                      <span>NÃO use maiúsculas: <code>Whatsapp_Redirect</code> ← errado</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                      <span style={{ color: "#15803d", fontWeight: 700 }}>✓</span>
                      <span>Correto: <code style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "1px 6px", color: "#15803d" }}>whatsapp_redirect</code> — tudo minúsculo, underscore no meio</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {[
                    { num: "e", text: 'Deixe a opção "Usar expressão regular" desmarcada' },
                    { num: "f", text: 'Em "Este acionador é ativado em", escolha', bold: "Todos os eventos personalizados" },
                    { num: "g", text: "No campo de nome no topo da tela (onde está escrito \"Nome do acionador sem título\"), escreva:", bold: "Evento - whatsapp_redirect" },
                    { num: "h", text: "Clique em", bold: "Salvar" },
                  ].map((item) => (
                    <div key={item.num} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 12px" }}>
                      <span style={{ background: "#6366f1", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{item.num}</span>
                      <span style={{ fontSize: "0.83rem" }}>
                        {item.text}{item.bold ? <> <strong>&ldquo;{item.bold}&rdquo;</strong></> : null}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginTop: 12 }}>
                  <strong style={{ fontSize: "0.83rem", color: "#14532d" }}>✅ Resultado esperado:</strong>
                  <span style={{ fontSize: "0.82rem", color: "#166534", marginLeft: 6 }}>
                    O acionador <strong>&ldquo;Evento - whatsapp_redirect&rdquo;</strong> aparece na lista de acionadores.
                  </span>
                </div>
              </div>
            </li>

            {/* PASSO 3 — Criar a tag */}
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div><strong>Crie a Tag de Conversão do Google Ads no GTM</strong></div>
                <p className="guide-step__sub" style={{ marginTop: 6 }}>
                  Ainda dentro do GTM, agora crie a tag que dispara a conversão:
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {[
                    { num: "a", text: "No menu esquerdo, clique em", bold: "Tags" },
                    { num: "b", text: "Clique no botão azul", bold: "Nova" },
                    { num: "c", text: "Clique no bloco cinza de configuração da tag" },
                    { num: "d", text: "Na lista, procure e clique em", bold: "Conversão do Google Ads" },
                  ].map((item) => (
                    <div key={item.num} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 12px" }}>
                      <span style={{ background: "#1d4ed8", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{item.num}</span>
                      <span style={{ fontSize: "0.83rem" }}>
                        {item.text}{item.bold ? <> <strong>&ldquo;{item.bold}&rdquo;</strong></> : null}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Preencha os campos assim:</div>
                  {[
                    ["ID de conversão", "AW-XXXXXXXXX", "O mesmo Conversion ID que você copiou do Google Ads"],
                    ["Rótulo de conversão", "AbCdEfGhIjKlM", "O mesmo Conversion Label que você copiou"],
                  ].map(([label, example, desc]) => (
                    <div key={String(label)}>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, minWidth: 200 }}>{label}:</span>
                        <code style={{ fontSize: "0.82rem", color: "#1d4ed8" }}>{example}</code>
                      </div>
                      <div className="guide-step__sub" style={{ marginTop: 2 }}>{desc}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {[
                    { num: "e", text: "Role a tela para baixo e clique no bloco de", bold: "Acionadores" },
                    { num: "f", text: "Na lista que aparecer, selecione o acionador que você criou:", bold: "Evento - whatsapp_redirect" },
                    { num: "g", text: "No campo de nome no topo, escreva:", bold: "Google Ads - Conversão Lead WhatsApp" },
                    { num: "h", text: "Clique em", bold: "Salvar" },
                  ].map((item) => (
                    <div key={item.num} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 12px" }}>
                      <span style={{ background: "#1d4ed8", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{item.num}</span>
                      <span style={{ fontSize: "0.83rem" }}>
                        {item.text}{item.bold ? <> <strong>&ldquo;{item.bold}&rdquo;</strong></> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </li>

            {/* PASSO 4 — Adicionar Conversion Linker */}
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div><strong>Adicione também uma tag &ldquo;Conversion Linker&rdquo; (importante)</strong></div>
                <p className="guide-step__sub" style={{ marginTop: 6 }}>
                  Esta tag faz o Google associar o clique do anúncio ao lead corretamente. Sem ela, algumas conversões podem não ser atribuídas.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {[
                    { num: "a", text: "Tags → Nova → clique no bloco de configuração" },
                    { num: "b", text: 'Na lista, procure e clique em', bold: "Linker de conversão do Google Ads" },
                    { num: "c", text: 'Acionador:', bold: "All Pages (Todas as páginas)" },
                    { num: "d", text: 'Nome da tag:', bold: "Conversion Linker" },
                    { num: "e", text: "Clique em", bold: "Salvar" },
                  ].map((item) => (
                    <div key={item.num} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 12px" }}>
                      <span style={{ background: "#6b7280", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{item.num}</span>
                      <span style={{ fontSize: "0.83rem" }}>
                        {item.text}{item.bold ? <> <strong>&ldquo;{item.bold}&rdquo;</strong></> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </li>

            {/* PASSO 5 — Publicar */}
            <li className="guide-step">
              <span className="guide-step__num">5</span>
              <div className="guide-step__text">
                <div><strong>Publique o container — as tags só funcionam após publicar</strong></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {[
                    { num: "a", text: 'No canto superior direito do GTM, clique no botão azul', bold: "Enviar" },
                    { num: "b", text: 'No campo "Nome da versão", escreva:', bold: "Conversão WhatsApp" },
                    { num: "c", text: 'Clique em', bold: "Publicar" },
                  ].map((item) => (
                    <div key={item.num} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 12px" }}>
                      <span style={{ background: "#22c55e", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{item.num}</span>
                      <span style={{ fontSize: "0.83rem" }}>
                        {item.text}{item.bold ? <> <strong>&ldquo;{item.bold}&rdquo;</strong></> : null}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginTop: 12 }}>
                  <strong style={{ fontSize: "0.83rem", color: "#14532d" }}>✅ Configuração via GTM concluída!</strong>
                  <p style={{ fontSize: "0.82rem", color: "#166534", margin: "6px 0 0" }}>
                    Cada vez que um lead clicar no botão do WhatsApp, o evento <code>whatsapp_redirect</code> será disparado e a tag de conversão enviará o sinal para o Google Ads.
                  </p>
                </div>
              </div>
            </li>
          </ol>

          {/* Como testar */}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "14px 16px", marginTop: 4 }}>
            <strong style={{ color: "#1d4ed8", display: "block", marginBottom: 8 }}>Como testar se funcionou</strong>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.83rem" }}>
              {[
                "No GTM, clique em \"Visualizar\" (Preview) no canto superior direito",
                "Cole a URL do link de campanha do sistema no campo que aparecer e clique em \"Conectar\"",
                "Você vai ver a página abrir com uma barra do GTM embaixo",
                "Clique no botão do WhatsApp na página",
                "Na barra do GTM, procure o evento \"whatsapp_redirect\" na lista de eventos",
                "Clique nele e veja se a tag \"Google Ads - Conversão Lead WhatsApp\" aparece como disparada",
                "Se aparecer com check verde → funcionou!",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#1d4ed8", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* MÉTODO 3 — Via GA4 */}
        <div className="dashboard-section-divider">
          <span>Método 3 — Via GA4 (para quem já usa o Google Analytics 4)</span>
        </div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Rastreamento completo com GA4 + GTM — 6 passos</h3>
          </div>
          <p className="dashboard-helper" style={{ marginBottom: 16 }}>
            Use este método se você já tem GA4 configurado ou quer os dados de audiência no Analytics. O sistema dispara o evento <code>generate_lead</code> que você depois importa para o Google Ads.
          </p>

          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div><strong>Crie uma propriedade no Google Analytics 4</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Acesse <strong>analytics.google.com</strong> → <strong>Administrador</strong> → <strong>+ Criar propriedade</strong>. Selecione o tipo <strong>Web</strong>.
                </div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Ao terminar, vá em <strong>Fluxos de dados → seu fluxo web</strong> e copie o <strong>ID de medição</strong> — formato <code>G-XXXXXXXXXX</code>.
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div><strong>Crie um container no Google Tag Manager</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Acesse <strong>tagmanager.google.com</strong> → crie uma conta → adicione um container do tipo <strong>Web</strong>.
                </div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Copie o <strong>ID do container</strong> — formato <code>GTM-XXXXXXX</code>.
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div><strong>Conecte o GA4 dentro do GTM</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  No GTM: <strong>Tags → Nova → Google Analytics: Configuração do GA4</strong>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8, background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                  {[
                    ["ID de medição", "G-XXXXXXXXXX (copiado no passo 1)"],
                    ["Acionador", "All Pages (Todas as Páginas)"],
                  ].map(([label, val]) => (
                    <div key={String(label)} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      <span className="guide-step__sub" style={{ margin: 0, minWidth: 140 }}>{label}:</span>
                      <strong style={{ fontSize: "0.84rem" }}>{val}</strong>
                    </div>
                  ))}
                </div>
                <div className="guide-step__sub" style={{ marginTop: 8 }}>Publique o container após criar a tag.</div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div><strong>Cadastre os IDs no painel do cliente</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Em <strong>Clientes → cliente → Editar → Rastreamento</strong>, preencha:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
                  {[
                    ["GTM ID",                "GTM-XXXXXXX"],
                    ["GA4 ID",                "G-XXXXXXXXXX"],
                    ["Google Ads ID",         "AW-XXXXXXXXX"],
                    ["Google Ads Conv. Label","AbCdEfGhIjKlM"],
                  ].map(([label, example]) => (
                    <div key={String(label)} style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                      <span className="guide-step__sub" style={{ margin: 0, minWidth: 220 }}>{label}:</span>
                      <code style={{ fontSize: "0.78rem" }}>{example}</code>
                    </div>
                  ))}
                </div>
                <div className="guide-step__sub" style={{ marginTop: 8 }}>
                  Salve. O sistema injeta o GTM automaticamente e dispara o evento <code>generate_lead</code> a cada conversão.
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">5</span>
              <div className="guide-step__text">
                <div><strong>Marque &ldquo;generate_lead&rdquo; como evento-chave no GA4 — CRÍTICO</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  No GA4: <strong>Configurar → Eventos</strong>. Aguarde o primeiro lead chegar e localize o evento <code>generate_lead</code>.
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 12px", margin: "8px 0", fontSize: "0.82rem", fontWeight: 600, color: "#15803d" }}>
                  ✓ Ative &quot;Marcar como evento-chave&quot;
                </div>
                <div className="guide-step__sub">
                  Sem isso, o Google Ads não sabe que esse evento é uma conversão.
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">6</span>
              <div className="guide-step__text">
                <div><strong>Importe o generate_lead para o Google Ads</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  No Google Ads: <strong>Metas → Conversões → + Nova conversão → Importar → Google Analytics 4 → generate_lead</strong>. Importe como conversão primária.
                </div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  O algoritmo do Google passa a otimizar para leads reais a partir deste momento.
                </div>
              </div>
            </li>
          </ol>
        </article>

        {/* Qual método usar */}
        <article className="dashboard-card">
          <div className="dashboard-card__header"><h3>Qual método escolher?</h3></div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Situação</th>
                  <th>Use este método</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Está configurando pela primeira vez", "Método 1 — o mais simples (3 passos)"],
                  ["A conta do Google Ads não mostra opção de importar do GA4", "Método 1 — disparo direto"],
                  ["Já tem GTM instalado no site ou quer testar pelo Preview", "Método 2 — via GTM"],
                  ["Já tem GA4 e quer dados de audiência e importação", "Método 3 — GA4 completo"],
                  ["Quer os dois sinais ao mesmo tempo (mais seguro)", "Método 1 + Método 2 — o Google deduplica pelo gclid"],
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

        {/* Site próprio — UTM passthrough */}
        <div className="dashboard-section-divider">
          <span>Você tem site próprio? Leia isso primeiro</span>
        </div>

        <article className="dashboard-card" style={{ border: "2px solid #f59e0b" }}>
          <div className="dashboard-card__header">
            <div>
              <h3>Por que os leads aparecem sem origem quando o site é próprio?</h3>
              <p className="dashboard-helper" style={{ marginBottom: 0 }}>
                O problema mais comum de quem usa WordPress, Elementor ou qualquer site externo.
              </p>
            </div>
          </div>

          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
            <strong style={{ color: "#92400e", display: "block", marginBottom: 8 }}>O que acontece sem o script</strong>
            <p style={{ fontSize: "0.83rem", color: "#78350f", lineHeight: 1.6, marginBottom: 10 }}>
              Quando alguém clica no seu anúncio do Google, o Google adiciona automaticamente um código chamado <code>gclid</code> na URL do site. Esse código indica que a pessoa veio do Google Ads. O mesmo vale para a Meta, que adiciona o <code>fbclid</code>.
            </p>
            <p style={{ fontSize: "0.83rem", color: "#78350f", lineHeight: 1.6, marginBottom: 8 }}>
              O problema: esse código está na URL da página, mas <strong>não vai automaticamente para o botão do WhatsApp</strong>. Resultado: o lead aparece no sistema sem origem — o sistema não sabe se veio do Google ou da Meta.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.8rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "#dc2626", fontWeight: 700, flexShrink: 0 }}>✗</span>
                <span>URL do site recebe: <code style={{ fontSize: "0.75rem" }}>clinica.com.br/botox?gclid=ABC123</code></span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "#dc2626", fontWeight: 700, flexShrink: 0 }}>✗</span>
                <span>Botão do WhatsApp aponta para: <code style={{ fontSize: "0.75rem" }}>zapfaturamento.com.br/w/clinica/campanha</code> — <span style={{ color: "#dc2626" }}>sem o gclid → origem perdida</span></span>
              </div>
            </div>
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
            <strong style={{ color: "#14532d", display: "block", marginBottom: 8 }}>A solução — um script de 5 linhas resolve tudo</strong>
            <p style={{ fontSize: "0.83rem", color: "#166534", lineHeight: 1.6, marginBottom: 10 }}>
              Um pequeno script detecta automaticamente os parâmetros da URL atual e os adiciona em todos os botões que apontam para o sistema. Você instala uma vez e funciona para Google e Meta ao mesmo tempo.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.8rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "#15803d", fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span>Script detecta o gclid na URL</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "#15803d", fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span>Atualiza automaticamente o link do botão do WhatsApp</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "#15803d", fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span>Sistema registra o lead com origem Google Ads ou Meta Ads</span>
              </div>
            </div>
          </div>

          {/* Opção 1 — GTM */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 10 }}>
              Opção 1 — Instalar pelo GTM (mais fácil, sem mexer no site)
            </div>
            <ol className="guide-steps">
              <li className="guide-step">
                <span className="guide-step__num">1</span>
                <div className="guide-step__text">No GTM: <strong>Tags → Nova → HTML Personalizado</strong></div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">2</span>
                <div className="guide-step__text">
                  <div>Cole o código abaixo no campo de HTML:</div>
                  <div style={{ marginTop: 10 }}>
                    <code className="dashboard-code-block" style={{ display: "block", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{UTM_PASSTHROUGH_SCRIPT}</code>
                    <CopyButton value={UTM_PASSTHROUGH_SCRIPT} label="Copiar script para GTM" />
                  </div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">3</span>
                <div className="guide-step__text">Em <strong>Acionamento</strong>, escolha <strong>All Pages</strong>.</div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">4</span>
                <div className="guide-step__text">Clique em <strong>Salvar</strong> e depois <strong>Enviar → Publicar</strong>.</div>
              </li>
            </ol>
          </div>

          {/* Opção 2 — direto no site */}
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 10 }}>
              Opção 2 — Colar direto no código do site (WordPress, Elementor, etc.)
            </div>
            <p style={{ fontSize: "0.83rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: 10 }}>
              Adicione o código abaixo antes do fechamento da tag <code>&lt;/body&gt;</code> em todas as páginas com botão do WhatsApp. No WordPress, use um plugin de &ldquo;Header and Footer Scripts&rdquo;.
            </p>
            <code className="dashboard-code-block" style={{ display: "block", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{UTM_PASSTHROUGH_SCRIPT}</code>
            <CopyButton value={UTM_PASSTHROUGH_SCRIPT} label="Copiar script para o site" />
          </div>

          <div className="guide-tip guide-tip--info" style={{ marginTop: 20 }}>
            <strong>Funciona para Google e Meta ao mesmo tempo.</strong> O script detecta qualquer parâmetro — <code>gclid</code>, <code>fbclid</code>, <code>utm_source</code>, <code>utm_campaign</code> — e passa tudo automaticamente.
          </div>
        </article>

        {/* Alerta final */}
        <article className="dashboard-card" style={{ border: "2px solid #f59e0b", padding: 0, overflow: "hidden" }}>
          <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <strong style={{ color: "#92400e", fontSize: "0.9rem" }}>
              Por que a campanha fica cara e ineficiente sem rastreamento
            </strong>
          </div>
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: "0.84rem", color: "var(--dark)", lineHeight: 1.6, marginBottom: 10 }}>
              O algoritmo do Google Ads aprende com os dados de conversão. Sem esse sinal, a campanha não tem como otimizar — o Google mostra o anúncio para qualquer pessoa sem inteligência, gastando o orçamento sem critério.
            </p>
            <p style={{ fontSize: "0.84rem", color: "var(--dark)", lineHeight: 1.6, margin: 0 }}>
              Com o rastreamento configurado, cada lead que chega ao WhatsApp vira um sinal para o algoritmo aprender qual perfil converte mais — e investir o orçamento nessas pessoas. <strong>É a diferença entre uma campanha que escala e uma que só drena dinheiro.</strong>
            </p>
          </div>
        </article>

      </section>
    </main>
  );
}
