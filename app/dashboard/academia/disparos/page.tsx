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
              Envie mensagens pelo WhatsApp oficial com delay automático e rastreamento completo de entrega.
            </p>
          </div>
        </header>

        {/* Por que API Oficial */}
        <div className="dashboard-section-divider"><span>Por que usar a API Oficial?</span></div>

        <div className="dashboard-detail-grid">

          <article className="dashboard-card" style={{ borderLeft: "3px solid #ef4444" }}>
            <div className="dashboard-card__header">
              <h3>Ferramentas não oficiais — riscos reais</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "🚫", label: "Número banido permanentemente", desc: "O WhatsApp bane números que enviam mensagens em massa por apps ou bots não oficiais. Um número banido para de funcionar completamente — sem aviso prévio." },
                { icon: "🚫", label: "Sem confirmação de entrega", desc: "Ferramentas não oficiais podem falhar silenciosamente. A mensagem não chega e você não sabe." },
                { icon: "🚫", label: "Sem histórico de envios", desc: "Nenhum registro de quem recebeu, quem não recebeu, nem quais erros ocorreram." },
                { icon: "🚫", label: "Viola os Termos do WhatsApp", desc: "Bots não oficiais violam os termos do WhatsApp e podem resultar no bloqueio de toda a conta." },
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
              <h3>Meta Cloud API — proteção e controle</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "✅", label: "Número protegido", desc: "A API oficial é autorizada pelo WhatsApp. Sem risco de banimento quando usado corretamente." },
                { icon: "✅", label: "Confirmação de entrega individual", desc: "Cada mensagem retorna um ID oficial. Você sabe exatamente quais foram entregues e quais falharam." },
                { icon: "✅", label: "Delay automático entre mensagens", desc: "O sistema aguarda 2 a 3 segundos entre cada envio, simulando comportamento humano e respeitando os limites da API." },
                { icon: "✅", label: "Histórico completo", desc: "Todos os envios ficam registrados com status, hora e mensagem de erro, se houver." },
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

        {/* O que você precisa ter */}
        <div className="dashboard-section-divider"><span>O que você precisa ter antes de começar</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Pré-requisitos obrigatórios — prepare esses 4 itens primeiro</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                icon: "🏢",
                num: "1",
                label: "Meta Business Manager verificado",
                desc: "Uma conta verificada em business.facebook.com. Se ainda não tem, crie uma e faça a verificação da empresa antes de prosseguir.",
              },
              {
                icon: "📱",
                num: "2",
                label: "Número de telefone dedicado e novo",
                desc: "Um número que NÃO esteja vinculado a nenhum outro WhatsApp. Não pode ser o número principal da clínica se ele já tem WhatsApp ativo. Pode ser um chip novo ou número virtual.",
              },
              {
                icon: "✅",
                num: "3",
                label: "Conta WhatsApp Business API aprovada",
                desc: "O número precisa ser verificado pela Meta. O processo é feito dentro do Meta Business Manager e pode levar alguns dias.",
              },
              {
                icon: "🔑",
                num: "4",
                label: "Access Token permanente",
                desc: "Um token de sistema gerado no Meta Business Manager. IMPORTANTE: use sempre o token permanente, não o token temporário de 24 horas — ele expira e o disparo para no meio.",
              },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", gap: 12, background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <span style={{ background: "#7c3aed", color: "#fff", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.78rem" }}>{item.num}</span>
                  <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 4 }}>{item.label}</div>
                  <div className="guide-step__sub">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Como obter as credenciais */}
        <div className="dashboard-section-divider"><span>Como obter as credenciais na Meta — passo a passo</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Configurar no Meta Developers — cada clique explicado</h3>
          </div>

          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div><strong>Crie um App no Meta Developers</strong></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {[
                    { num: "a", text: "Acesse", bold: "developers.facebook.com" },
                    { num: "b", text: "Clique em", bold: "Meus Apps → Criar App" },
                    { num: "c", text: 'Em "Qual é o seu caso de uso?", escolha', bold: "Other (Outro)" },
                    { num: "d", text: 'Em "Selecione o tipo do app", escolha', bold: "Business" },
                    { num: "e", text: "Dê um nome ao app e associe ao seu Meta Business Manager" },
                    { num: "f", text: "Clique em", bold: "Criar App" },
                    { num: "g", text: 'Na tela de produtos, encontre o card "WhatsApp" e clique em', bold: "Configurar" },
                  ].map((item) => (
                    <div key={item.num} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 7, padding: "7px 12px" }}>
                      <span style={{ background: "#7c3aed", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{item.num}</span>
                      <span style={{ fontSize: "0.83rem" }}>
                        {item.text}{item.bold ? <> <strong>{item.bold}</strong></> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div><strong>Copie o Phone Number ID e o WABA ID</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Dentro do App, acesse <strong>WhatsApp → Configuração da API</strong>. Você verá os dois valores:
                </div>
                <div style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Phone Number ID</div>
                    <code style={{ fontSize: "0.88rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "3px 10px", color: "#1d4ed8" }}>123456789012345</code>
                    <div className="guide-step__sub" style={{ marginTop: 4 }}>Número com 15 dígitos, diferente do número de telefone em si.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>WABA ID (WhatsApp Business Account ID)</div>
                    <code style={{ fontSize: "0.88rem", background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 5, padding: "3px 10px", color: "#6d28d9" }}>987654321098765</code>
                    <div className="guide-step__sub" style={{ marginTop: 4 }}>ID da conta de negócios do WhatsApp.</div>
                  </div>
                </div>
                <div className="guide-tip" style={{ marginTop: 10 }}>Anote os dois valores — você vai precisar deles ao cadastrar a instância no sistema.</div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div><strong>Crie o Token de Sistema Permanente</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Este token é como a &ldquo;senha&rdquo; de acesso à API. Deve ser permanente — não use o token temporário de 24h.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {[
                    { num: "a", text: "Acesse", bold: "Meta Business Manager → Configurações → Usuários do sistema" },
                    { num: "b", text: 'Clique em', bold: "Adicionar" },
                    { num: "c", text: "Dê um nome (ex: Sistema Disparos) e defina como", bold: "Administrador" },
                    { num: "d", text: "Clique no usuário criado e depois em", bold: "Gerar novo token" },
                    { num: "e", text: "Selecione o App que você criou no passo 1" },
                    { num: "f", text: "Marque as permissões:", bold: "whatsapp_business_messaging e whatsapp_business_management" },
                    { num: "g", text: "Clique em", bold: "Gerar token" },
                    { num: "h", text: "Copie e salve o token imediatamente — ele só aparece uma vez!" },
                  ].map((item) => (
                    <div key={item.num} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 7, padding: "7px 12px" }}>
                      <span style={{ background: "#7c3aed", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{item.num}</span>
                      <span style={{ fontSize: "0.83rem" }}>
                        {item.text}{item.bold ? <> <strong>{item.bold}</strong></> : null}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 14px", marginTop: 10, display: "flex", gap: 10 }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
                  <div style={{ fontSize: "0.84rem", color: "#78350f", lineHeight: 1.6 }}>
                    <strong>Use sempre o token permanente, nunca o token de 24h.</strong> O token temporário expira e o disparo para no meio com erro. O token de sistema não expira enquanto você não o revogar manualmente.
                  </div>
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div><strong>Verifique o número de telefone dentro do App</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Em <strong>WhatsApp → Números de telefone</strong>, adicione o número e verifique via SMS ou chamada. Após verificado, o número está pronto para enviar mensagens.
                </div>
              </div>
            </li>
          </ol>
        </article>

        {/* Como usar no sistema */}
        <div className="dashboard-section-divider"><span>Como usar no sistema — passo a passo</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Passo 1 — Conectar a instância (cadastrar as credenciais)</h3>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Acesse <strong>Disparos</strong> no menu lateral e clique na aba <strong>Instâncias Meta</strong>.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Clique em <strong>+ Conectar instância</strong> e preencha os campos:</div>
                <div style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    ["Nome da instância", "Ex: Principal, Clínica Centro — qualquer nome para identificar"],
                    ["Phone Number ID", "O ID de 15 dígitos copiado no passo 2 acima"],
                    ["Access Token", "O token de sistema permanente (começa com EAAxx...)"],
                    ["WABA ID", "Opcional, mas recomendado salvar"],
                  ].map(([label, desc]) => (
                    <div key={String(label)} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, minWidth: 150, flexShrink: 0 }}>{label}:</span>
                      <span className="guide-step__sub" style={{ margin: 0 }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Clique em <strong>Salvar instância</strong>. A instância fica disponível para todas as campanhas.</div>
              </div>
            </li>
          </ol>
        </article>

        <article className="dashboard-card" style={{ marginTop: 0 }}>
          <div className="dashboard-card__header">
            <h3>Passo 2 — Criar a campanha de disparo</h3>
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
                <div>Preencha o nome, selecione a instância e escreva a mensagem.</div>
                <div className="guide-step__sub" style={{ marginTop: 4 }}>
                  A mensagem pode ser editada depois. A campanha fica no status <strong>Rascunho</strong> até você disparar.
                </div>
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
                <div>Prepare um arquivo CSV com as colunas <code>phone</code> e <code>name</code> (nome é opcional).</div>
                <div style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", marginTop: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.78rem", marginBottom: 6, color: "var(--muted)" }}>Exemplo de arquivo CSV:</div>
                  <code style={{ display: "block", whiteSpace: "pre", fontSize: "0.78rem", lineHeight: 1.7 }}>
{`phone,name
5511999990001,Ana Silva
5511999990002,Carlos Lima
5511999990003`}
                  </code>
                </div>
                <div className="guide-step__sub" style={{ marginTop: 8 }}>
                  O telefone deve incluir o código do país (55 para Brasil) e o DDD. Exemplo: <code>5511999990001</code> = Brasil (55) + DDD 11 + número. Aceita separador por vírgula, ponto-e-vírgula ou tabulação.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Dentro da campanha, clique em <strong>Importar CSV</strong> e selecione o arquivo.</div>
                <div className="guide-step__sub" style={{ marginTop: 4 }}>Os contatos são carregados automaticamente. A lista anterior é substituída a cada importação.</div>
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
        <div className="dashboard-section-divider"><span>Disparar e acompanhar</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Passo 4 — Disparar a campanha</h3>
          </div>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Revise a mensagem, a instância selecionada e a lista de contatos.</div>
                <div className="guide-tip guide-tip--warn" style={{ marginTop: 8 }}>
                  Uma vez iniciado, o disparo não pode ser pausado. Confira tudo antes de clicar em Disparar.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Clique em <strong>Disparar para X contatos</strong> e confirme na janela que aparecer.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Acompanhe o progresso em tempo real pela barra de progresso.</div>
                <div className="guide-step__sub" style={{ marginTop: 4 }}>
                  O sistema envia uma mensagem, aguarda <strong>2 a 3 segundos</strong> e envia a próxima. Esse delay protege o número de restrições pela Meta.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div>Ao concluir, o status muda para <strong>Concluído</strong> e o resumo mostra total enviado e falhas.</div>
                <div className="guide-step__sub" style={{ marginTop: 4 }}>Expanda a lista de contatos para ver o status de cada número individualmente.</div>
              </div>
            </li>
          </ol>
        </article>

        {/* Boas práticas */}
        <div className="dashboard-section-divider"><span>Boas práticas e limites</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>O que fazer e o que evitar</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 10, fontSize: "0.9rem" }}>✓ Boas práticas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Envie apenas para contatos que já tiveram algum contato com a clínica.",
                  "Use horários comerciais: segunda a sexta, das 8h às 18h.",
                  "Personalize a mensagem com o nome quando possível.",
                  "Comece com listas pequenas (até 100 contatos) para testar.",
                  "Monitore a lista de falhas e remova números inválidos.",
                  "Sempre ofereça uma forma do contato pedir para não receber mais.",
                ].map((tip) => (
                  <div key={tip} style={{ display: "flex", gap: 8, fontSize: "0.84rem" }}>
                    <span style={{ color: "#15803d", flexShrink: 0, fontWeight: 700 }}>✓</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: 10, fontSize: "0.9rem" }}>✕ O que evitar</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Não envie para listas compradas ou sem consentimento.",
                  "Evite mais de 1.000 mensagens por dia nos primeiros 30 dias.",
                  "Não use para spam ou conteúdo enganoso.",
                  "Não remova o delay entre mensagens — aumenta o risco de restrição.",
                  "Evite disparar fora do horário comercial, especialmente promoções.",
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
            <h3>Limites da Meta Cloud API por nível de conta</h3>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Nível</th>
                  <th>Limite diário</th>
                  <th>Como subir de nível</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Nível 1</strong> <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>(conta nova)</span></td>
                  <td>1.000 conversas/dia</td>
                  <td>Envie com qualidade e sem bloqueios por 7 dias</td>
                </tr>
                <tr>
                  <td><strong>Nível 2</strong></td>
                  <td>10.000 conversas/dia</td>
                  <td>Subida automática pela Meta após bom histórico</td>
                </tr>
                <tr>
                  <td><strong>Nível 3</strong></td>
                  <td>100.000 conversas/dia</td>
                  <td>Exige conta business verificada e histórico sólido</td>
                </tr>
                <tr>
                  <td><strong>Nível 4</strong></td>
                  <td>Ilimitado</td>
                  <td>Conta com altíssimo volume e reputação excelente</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="guide-tip guide-tip--info" style={{ marginTop: 12 }}>
            A maioria das clínicas opera confortavelmente no Nível 1 e 2. O sistema já respeita os delays necessários para manter a reputação da conta.
          </div>
        </article>

        {/* Resumo */}
        <div className="dashboard-section-divider"><span>Resumo do fluxo completo</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Da configuração ao disparo — 5 passos</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {[
              { step: "1", label: "Obter credenciais", desc: "Phone ID + Token na Meta" },
              { step: "2", label: "Conectar instância", desc: "Cadastrar no sistema" },
              { step: "3", label: "Criar campanha", desc: "Nome + mensagem" },
              { step: "4", label: "Importar CSV", desc: "phone, name" },
              { step: "5", label: "Disparar", desc: "Delay 2-3s entre msgs" },
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
