import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

export default async function DisparosAcademiaPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/disparos"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Academia · Disparos</span>
            <h2>Como usar Disparos em Massa</h2>
            <p>
              Envie mensagens pelo WhatsApp oficial com delay automatico e rastreamento completo de entrega.
            </p>
          </div>
        </header>

        {/* Por que API Oficial */}
        <div className="dashboard-section-divider"><span>Por que usar a API Oficial?</span></div>

        <div className="dashboard-detail-grid">

          <article className="dashboard-card" style={{ borderLeft: "3px solid #ef4444" }}>
            <div className="dashboard-card__header">
              <h3>Metodos informais — riscos</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "🚫", label: "Banimento do numero", desc: "WhatsApp bane numeros que enviam mensagens em massa sem a API oficial. Um numero banido para de funcionar completamente." },
                { icon: "🚫", label: "Sem entrega garantida", desc: "Ferramentas nao oficiais (automacoes via web/celular) podem falhar silenciosamente — a mensagem nao chega e voce nao sabe." },
                { icon: "🚫", label: "Sem historico", desc: "Nenhum registro de quem recebeu, quem nao recebeu, nem quais erros ocorreram." },
                { icon: "🚫", label: "Viola os Termos de Servico", desc: "O uso de bots e automacoes nao oficiais viola os termos do WhatsApp e pode resultar no bloqueio de toda a conta." },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: "1rem", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{item.label}</div>
                    <div className="guide-step__sub" style={{ marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card" style={{ borderLeft: "3px solid #22c55e" }}>
            <div className="dashboard-card__header">
              <h3>Meta Cloud API — vantagens</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "✅", label: "Numero protegido", desc: "A API oficial e autorizada pelo WhatsApp. Nao ha risco de banimento por envio em massa quando feito corretamente." },
                { icon: "✅", label: "Confirmacao de entrega", desc: "Cada mensagem retorna um ID oficial. Voce sabe exatamente quais foram entregues e quais falharam." },
                { icon: "✅", label: "Delay automatico", desc: "O sistema espera 2 a 3 segundos entre cada mensagem, simulando comportamento humano e respeitando os limites da API." },
                { icon: "✅", label: "Historico completo", desc: "Todos os envios ficam registrados com status, hora e mensagem de erro, se houver." },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: "1rem", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{item.label}</div>
                    <div className="guide-step__sub" style={{ marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </article>

        </div>

        {/* O que e necessario */}
        <div className="dashboard-section-divider"><span>O que voce precisa ter</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Pre-requisitos obrigatorios</h3>
          </div>
          <div className="guide-kanban-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {[
              { icon: "🏢", label: "Meta Business Manager", desc: "Uma conta verificada no Meta Business Manager. Acesse business.facebook.com e crie ou use uma existente." },
              { icon: "📱", label: "Numero de telefone dedicado", desc: "Um numero de celular ou fixo que nao esteja vinculado a nenhum outro WhatsApp. Nao pode ser o numero principal da clinica se ele ja tem WhatsApp ativo." },
              { icon: "✅", label: "Conta WhatsApp Business verificada", desc: "O numero precisa ser verificado pela Meta como conta WhatsApp Business API. O processo e feito dentro do Meta Business Manager." },
              { icon: "🔑", label: "Access Token permanente", desc: "Um token de sistema permanente gerado dentro do Meta Business Manager → Configuracoes do sistema." },
            ].map((item) => (
              <div key={item.label} className="guide-kanban-stage" style={{ borderLeft: "3px solid #7c3aed" }}>
                <div className="guide-kanban-stage__name" style={{ borderLeft: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <div className="guide-kanban-stage__desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </article>

        {/* Como obter as credenciais */}
        <div className="dashboard-section-divider"><span>Como obter as credenciais na Meta</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Passo a passo — Configurar no Meta Business Manager</h3>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Acesse <strong>developers.facebook.com</strong> e crie um App do tipo <strong>Business</strong>.</div>
                <div className="guide-step__sub">Associe o App ao seu Meta Business Manager. Selecione o produto <strong>WhatsApp</strong> dentro do App.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>No painel do App, va em <strong>WhatsApp → Configuracao da API</strong>.</div>
                <div className="guide-step__sub">
                  Ali voce vera o <strong>Phone Number ID</strong> e o <strong>WhatsApp Business Account ID (WABA ID)</strong>. Copie e salve os dois.
                </div>
                <div style={{ background: "var(--bg-subtle, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 180, fontWeight: 600 }}>Phone Number ID:</span>
                    <code style={{ fontSize: "0.78rem" }}>123456789012345</code>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 180, fontWeight: 600 }}>WABA ID:</span>
                    <code style={{ fontSize: "0.78rem" }}>987654321098765</code>
                  </div>
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Crie um <strong>Token de Sistema Permanente</strong>.</div>
                <div className="guide-step__sub">
                  Va em <strong>Meta Business Manager → Configuracoes → Usuarios do sistema</strong>. Crie um usuario do sistema com permissao de administrador. Depois, clique em <strong>Gerar novo token</strong>, selecione o App e marque as permissoes <code>whatsapp_business_messaging</code> e <code>whatsapp_business_management</code>.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div>Verifique o numero de telefone dentro do painel do App.</div>
                <div className="guide-step__sub">
                  Em <strong>WhatsApp → Numeros de telefone</strong>, adicione e verifique o numero via SMS ou chamada. Apos verificado, o numero estara pronto para enviar mensagens.
                </div>
              </div>
            </li>
          </ol>

          <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 14px", marginTop: 16, display: "flex", gap: 10 }}>
            <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: "0.84rem", color: "#78350f", lineHeight: 1.6 }}>
              <strong>Use sempre o token permanente (token de sistema), nao o token temporario de 24h.</strong> O token temporario expira e o disparo para no meio. O token de sistema nao expira enquanto voce nao o revogar manualmente.
            </div>
          </div>
        </article>

        {/* Como usar no sistema */}
        <div className="dashboard-section-divider"><span>Como usar no Zap Faturamento</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Passo 1 — Conectar a instancia</h3>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Acesse <strong>Disparos</strong> no menu lateral e clique na aba <strong>Instancias Meta</strong>.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Clique em <strong>+ Conectar instancia</strong> e preencha os campos:</div>
                <div style={{ background: "var(--bg-subtle, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 180, fontWeight: 600 }}>Nome da instancia:</span>
                    <span className="guide-step__sub" style={{ margin: 0 }}>Ex: Principal, Clinica Centro</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 180, fontWeight: 600 }}>Phone Number ID:</span>
                    <span className="guide-step__sub" style={{ margin: 0 }}>Copiado do painel da Meta</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 180, fontWeight: 600 }}>Access Token:</span>
                    <span className="guide-step__sub" style={{ margin: 0 }}>Token de sistema permanente (EAAxx...)</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span className="guide-step__sub" style={{ margin: 0, minWidth: 180, fontWeight: 600 }}>WABA ID:</span>
                    <span className="guide-step__sub" style={{ margin: 0 }}>Opcional, mas recomendado salvar</span>
                  </div>
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Clique em <strong>Salvar instancia</strong>. A instancia ficara disponivel para todas as campanhas.</div>
              </div>
            </li>
          </ol>
        </article>

        <article className="dashboard-card" style={{ marginTop: 0 }}>
          <div className="dashboard-card__header">
            <h3>Passo 2 — Criar a campanha</h3>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Na aba <strong>Campanhas</strong>, clique em <strong>+ Nova campanha</strong>.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Preencha o nome, selecione a instancia e escreva a mensagem.</div>
                <div className="guide-step__sub">A mensagem pode ser editada depois. A campanha fica no status <strong>Rascunho</strong> ate voce disparar.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Clique em <strong>Criar campanha</strong> e depois abra ela clicando em <strong>Abrir</strong>.</div>
              </div>
            </li>
          </ol>
        </article>

        <article className="dashboard-card" style={{ marginTop: 0 }}>
          <div className="dashboard-card__header">
            <h3>Passo 3 — Importar contatos via CSV</h3>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Prepare um arquivo CSV com as colunas <code>phone</code> e <code>name</code> (nome e opcional).</div>
                <div style={{ background: "var(--bg-subtle, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.78rem", marginBottom: 6, color: "var(--muted)" }}>Exemplo de arquivo CSV:</div>
                  <code style={{ display: "block", whiteSpace: "pre", fontSize: "0.78rem", lineHeight: 1.7 }}>
{`phone,name
5511999990001,Ana Silva
5511999990002,Carlos Lima
5511999990003`}
                  </code>
                </div>
                <div className="guide-step__sub" style={{ marginTop: 8 }}>
                  O telefone deve ter DDD e, de preferencia, o codigo do pais (55 para Brasil). Aceita separador por virgula, ponto-e-virgula ou tabulacao.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Dentro da campanha, clique em <strong>Importar CSV</strong> e selecione o arquivo.</div>
                <div className="guide-step__sub">Os contatos serao carregados automaticamente. A lista antiga e substituida a cada importacao.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Verifique a contagem de contatos importados antes de disparar.</div>
              </div>
            </li>
          </ol>
        </article>

        {/* Disparo */}
        <div className="dashboard-section-divider"><span>Disparando e acompanhando</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Passo 4 — Disparar a campanha</h3>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Revise a mensagem, a instancia e a lista de contatos.</div>
                <div className="guide-tip guide-tip--warn" style={{ marginTop: 8 }}>
                  Uma vez iniciado, o disparo nao pode ser pausado. Confira tudo antes.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Clique em <strong>Disparar para X contatos</strong> e confirme.</div>
                <div className="guide-step__sub">O sistema vai pedir uma confirmacao antes de comecar.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Acompanhe o progresso em tempo real pela barra de progresso.</div>
                <div className="guide-step__sub">
                  O sistema envia uma mensagem, aguarda <strong>2 a 3 segundos</strong> e envia a proxima. Isso protege o numero de restricoes pela Meta.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div>Ao concluir, o status muda para <strong>Concluido</strong> e o resumo mostra enviados e falhas.</div>
                <div className="guide-step__sub">Expanda a lista de contatos para ver o status de cada numero individualmente.</div>
              </div>
            </li>
          </ol>
        </article>

        {/* Boas praticas */}
        <div className="dashboard-section-divider"><span>Boas praticas e limites</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>O que fazer e o que evitar</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 10, fontSize: "0.9rem" }}>Boas praticas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Envie apenas para contatos que ja tiveram algum contato previo com a clinica.",
                  "Use horarios comerciais: de segunda a sexta, das 8h as 18h.",
                  "Personalize a mensagem com o nome do paciente quando possivel.",
                  "Comece com listas pequenas (ate 100 contatos) para testar e ver a taxa de resposta.",
                  "Monitore a lista de falhas e remova numeros invalidos das proximas campanhas.",
                  "Sempre oferede uma forma do contato se descadastrar ou pedir para nao receber mais.",
                ].map((tip) => (
                  <div key={tip} style={{ display: "flex", gap: 8, fontSize: "0.84rem" }}>
                    <span style={{ color: "#15803d", flexShrink: 0, fontWeight: 700 }}>✓</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: 10, fontSize: "0.9rem" }}>O que evitar</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Nao envie mensagens para listas compradas ou sem consentimento previo.",
                  "Evite mais de 1.000 mensagens por dia nos primeiros 30 dias da conta.",
                  "Nao use a API para envio de spam ou conteudo enganoso.",
                  "Nao remova o delay entre mensagens — isso aumenta o risco de restricao.",
                  "Evite disparar fora do horario comercial, especialmente mensagens promocionais.",
                ].map((tip) => (
                  <div key={tip} style={{ display: "flex", gap: 8, fontSize: "0.84rem" }}>
                    <span style={{ color: "#dc2626", flexShrink: 0, fontWeight: 700 }}>✕</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* Limites da API */}
        <article className="dashboard-card" style={{ marginTop: 0 }}>
          <div className="dashboard-card__header">
            <h3>Limites da Meta Cloud API por nivel de conta</h3>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Nivel</th>
                  <th>Limite diario</th>
                  <th>Como subir de nivel</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Nivel 1</strong> <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>(conta nova)</span></td>
                  <td>1.000 conversas/dia</td>
                  <td>Envie com qualidade e sem bloqueios por 7 dias</td>
                </tr>
                <tr>
                  <td><strong>Nivel 2</strong></td>
                  <td>10.000 conversas/dia</td>
                  <td>Subida automatica pela Meta apos bom historico</td>
                </tr>
                <tr>
                  <td><strong>Nivel 3</strong></td>
                  <td>100.000 conversas/dia</td>
                  <td>Exige conta business verificada e historico solido</td>
                </tr>
                <tr>
                  <td><strong>Nivel 4</strong></td>
                  <td>Ilimitado</td>
                  <td>Conta com altissimo volume e reputacao excelente</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="guide-tip guide-tip--info" style={{ marginTop: 12 }}>
            A maioria das clinicas opera confortavelmente no Nivel 1 e 2. O sistema ja respeita os delays necessarios para manter a reputacao da conta.
          </div>
        </article>

        {/* Resumo rapido */}
        <div className="dashboard-section-divider"><span>Resumo rapido</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Fluxo completo de um disparo</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {[
              { step: "1", label: "Conectar instancia", desc: "Phone ID + Token" },
              { step: "2", label: "Criar campanha", desc: "Nome + Mensagem" },
              { step: "3", label: "Importar CSV", desc: "phone, name" },
              { step: "4", label: "Disparar", desc: "Delay 2-3s entre msgs" },
              { step: "5", label: "Acompanhar", desc: "Enviados e falhas" },
            ].map((item, i, arr) => (
              <div key={item.step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "#7c3aed", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.85rem", margin: "0 auto 4px"
                  }}>{item.step}</div>
                  <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{item.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{item.desc}</div>
                </div>
                {i < arr.length - 1 && (
                  <span style={{ color: "#d1d5db", fontSize: "1.2rem", flexShrink: 0 }}>→</span>
                )}
              </div>
            ))}
          </div>
        </article>

        <div style={{ textAlign: "center", marginTop: 4, marginBottom: 8 }}>
          <a
            href="/dashboard/disparos"
            className="dashboard-button"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Ir para Disparos em Massa
          </a>
        </div>

      </section>
    </main>
  );
}
