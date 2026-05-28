import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

export default async function AcademiaConectarWhatsappPage() {
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
            <span className="dashboard-eyebrow">Academia</span>
            <h2>Como conectar o WhatsApp ao sistema</h2>
            <p>Guia passo a passo para ativar a conexão via QR Code — explicado do zero.</p>
          </div>
        </header>

        {/* Entenda primeiro */}
        <article className="dashboard-card" style={{ border: "1px solid #bfdbfe", background: "#f0f7ff" }}>
          <div className="dashboard-card__header">
            <h3 style={{ color: "#1d4ed8" }}>Entenda o que você vai fazer antes de começar</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                icon: "🤔",
                title: "Por que preciso de um servidor separado?",
                desc: "O WhatsApp não permite que sites se conectem diretamente ao seu número. Para fazer a conexão funcionar, é preciso usar um programa chamado Evolution API que fica rodando em um servidor na internet 24 horas por dia. Pense nele como um intermediário que fica 'ouvindo' o WhatsApp e avisando o sistema quando chegar uma mensagem.",
              },
              {
                icon: "💡",
                title: "O que é a Evolution API?",
                desc: "É um programa gratuito (open source) que você instala em um servidor. Depois de instalado, o sistema consegue se comunicar com ele para criar a conexão via QR Code, receber mensagens e enviar as respostas do Kanban.",
              },
              {
                icon: "🖥️",
                title: "Onde instalar?",
                desc: "Você precisa de um VPS (servidor virtual privado). Os mais fáceis de usar são: Railway, Render ou EasyPanel. Custam entre R$20 e R$60/mês. Se você nunca fez isso antes, peça para um técnico fazer a instalação inicial.",
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

        {/* PARTE 1 — Instalar a Evolution API */}
        <div className="dashboard-section-divider"><span>Parte 1 — Instalar a Evolution API no servidor</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Como subir a Evolution API</h3>
          </div>
          <p className="dashboard-helper">
            Se você não tem experiência com servidores, recomendamos contratar um técnico para este passo. O processo leva cerca de 30 minutos e é feito uma única vez.
          </p>

          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div><strong>Contrate um servidor VPS</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Opções recomendadas (escolha uma):
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {[
                    ["Railway", "railway.app", "Fácil de usar, boa para começar — tem plano gratuito limitado"],
                    ["Render", "render.com", "Simples de configurar, plano grátis disponível"],
                    ["EasyPanel", "easypanel.io", "Interface visual para instalar sem linha de comando"],
                    ["VPS próprio", "DigitalOcean, Contabo, Vultr…", "Mais controle, paga pelo servidor inteiro"],
                  ].map(([name, url, desc]) => (
                    <div key={String(name)} style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 12px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <strong style={{ fontSize: "0.85rem", minWidth: 100 }}>{name}</strong>
                        <code style={{ fontSize: "0.78rem", color: "#6b7280" }}>{url}</code>
                      </div>
                      <div className="guide-step__sub" style={{ marginTop: 2 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div><strong>Instale a Evolution API no servidor</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Acesse o repositório oficial: <strong>github.com/EvolutionAPI/evolution-api</strong> e siga o guia de instalação com Docker ou Node.js.
                </div>
                <div className="guide-tip guide-tip--info" style={{ marginTop: 8 }}>
                  Se estiver usando Railway ou Render, existe a opção de fazer deploy direto pelo repositório Git sem precisar de linha de comando.
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div><strong>Configure a chave de acesso (API Key)</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  No arquivo de configuração da Evolution API, defina uma <strong>AUTHENTICATION_API_KEY</strong>. Essa é a senha de acesso à sua Evolution API — anote-a.
                </div>
                <div style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}>Exemplo no arquivo .env:</div>
                  <code style={{ fontSize: "0.82rem", color: "#374151" }}>AUTHENTICATION_API_KEY=minha-chave-secreta-aqui</code>
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div><strong>Anote a URL pública da sua Evolution API</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Após o servidor subir, ele vai gerar uma URL pública. Anote-a — você vai precisar na próxima etapa.
                </div>
                <div style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}>Exemplos de URL:</div>
                  <code style={{ fontSize: "0.82rem", color: "#374151", display: "block" }}>https://meu-projeto.railway.app</code>
                  <code style={{ fontSize: "0.82rem", color: "#374151", display: "block", marginTop: 4 }}>https://api.seudominio.com</code>
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">5</span>
              <div className="guide-step__text">
                <div><strong>Adicione as variáveis de ambiente no Vercel</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Acesse <strong>vercel.com → seu projeto → Settings → Environment Variables</strong> e adicione as três variáveis abaixo:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {[
                    ["EVOLUTION_API_URL", "https://meu-projeto.railway.app", "A URL pública da sua Evolution API — sem barra no final"],
                    ["EVOLUTION_API_KEY", "minha-chave-secreta-aqui", "A AUTHENTICATION_API_KEY que você definiu no passo 3"],
                    ["EVOLUTION_WEBHOOK_SECRET", "qualquer-texto-secreto", "Opcional, mas recomendado — serve para validar as mensagens recebidas"],
                  ].map(([name, example, desc]) => (
                    <div key={String(name)} style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                        <code style={{ fontSize: "0.82rem", fontWeight: 700, minWidth: 220 }}>{name}</code>
                        <code style={{ fontSize: "0.78rem", color: "#6b7280" }}>{example}</code>
                      </div>
                      <div className="guide-step__sub" style={{ marginTop: 4 }}>{desc}</div>
                    </div>
                  ))}
                </div>
                <div className="guide-tip" style={{ marginTop: 10 }}>
                  Após adicionar as variáveis, clique em <strong>Redeploy</strong> para o sistema reconhecer as configurações.
                </div>
              </div>
            </li>

            <li className="guide-step">
              <span className="guide-step__num">6</span>
              <div className="guide-step__text">
                <div><strong>Configure o webhook na Evolution API</strong></div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  O webhook é o endereço que a Evolution API vai chamar quando chegar uma mensagem nova. Configure apontando para:
                </div>
                <div style={{ background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
                  <code style={{ fontSize: "0.82rem", wordBreak: "break-all", color: "#374151" }}>
                    https://seu-dominio.vercel.app/api/whatsapp/webhook
                  </code>
                </div>
                <div className="guide-step__sub" style={{ marginTop: 6 }}>
                  Substitua <code>seu-dominio.vercel.app</code> pelo endereço do seu sistema no Vercel.
                </div>
              </div>
            </li>
          </ol>
        </article>

        {/* PARTE 2 — Conectar o WhatsApp */}
        <div className="dashboard-section-divider"><span>Parte 2 — Conectar o WhatsApp via QR Code</span></div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Como fazer a conexão — passo a passo no celular e no sistema</h3>
          </div>

          <div className="guide-tip guide-tip--info" style={{ marginBottom: 16 }}>
            <strong>Antes de começar:</strong> tenha em mãos o celular com o WhatsApp Business instalado e o número que será conectado.
          </div>

          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>No sistema, acesse <strong>Conexões WhatsApp</strong> no menu lateral esquerdo.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Clique no botão <strong>&ldquo;+ Nova Conexão&rdquo;</strong>.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Preencha o nome da conexão.</div>
                <div className="guide-step__sub" style={{ marginTop: 4 }}>
                  Exemplo: <strong>WhatsApp Clínica Centro</strong> ou <strong>Principal</strong>. Use um nome que identifique facilmente qual número é.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div>Clique em <strong>&ldquo;Criar e conectar&rdquo;</strong>.</div>
                <div className="guide-step__sub" style={{ marginTop: 4 }}>
                  Um QR Code vai aparecer na tela. Você tem cerca de 60 segundos para escanear antes de expirar.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">5</span>
              <div className="guide-step__text">
                <div><strong>No celular</strong>, abra o WhatsApp Business.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">6</span>
              <div className="guide-step__text">
                <div>Toque no ícone dos <strong>três pontinhos</strong> no canto superior direito.</div>
                <div className="guide-step__sub" style={{ marginTop: 4 }}>
                  Se estiver no iPhone: toque em <strong>Configurações</strong> no canto inferior direito.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">7</span>
              <div className="guide-step__text">
                <div>Toque em <strong>&ldquo;Aparelhos conectados&rdquo;</strong>.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">8</span>
              <div className="guide-step__text">
                <div>Toque em <strong>&ldquo;Conectar aparelho&rdquo;</strong>.</div>
                <div className="guide-step__sub" style={{ marginTop: 4 }}>
                  A câmera vai abrir automaticamente.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">9</span>
              <div className="guide-step__text">
                <div>Aponte a câmera do celular para o QR Code na tela do sistema.</div>
                <div className="guide-step__sub" style={{ marginTop: 4 }}>
                  Aguarde o WhatsApp reconhecer o QR Code — normalmente leva apenas 2 a 3 segundos.
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">10</span>
              <div className="guide-step__text">
                <div>No sistema, o status da conexão vai mudar para <strong style={{ color: "#15803d" }}>Conectado</strong>.</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 12px", marginTop: 8, fontSize: "0.82rem", fontWeight: 600, color: "#15803d" }}>
                  ✅ Conexão estabelecida com sucesso!
                </div>
              </div>
            </li>
          </ol>
        </article>

        {/* Cadastrar responsáveis */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Como cadastrar quem pode reconectar o WhatsApp</h3>
          </div>
          <p className="dashboard-helper">
            Se a conexão cair, você pode dar permissão para a secretária ou outro funcionário reconectar sem precisar entrar no painel de administração.
          </p>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Em <strong>Conexões WhatsApp</strong>, clique na conexão desejada.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Clique em <strong>&ldquo;Responsáveis&rdquo;</strong>.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Adicione o nome, WhatsApp e e-mail de cada pessoa responsável.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div>Defina as permissões de cada responsável:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {[
                    ["Pode reconectar", "Sim — para secretárias que precisam reconectar quando cair"],
                    ["Pode ver o Inbox", "Sim — para quem vai responder mensagens"],
                    ["Pode responder mensagens", "Sim — para atendentes"],
                  ].map(([perm, rec]) => (
                    <div key={String(perm)} style={{ display: "flex", gap: 8, alignItems: "baseline", background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 12px" }}>
                      <span style={{ fontSize: "0.83rem", fontWeight: 600, minWidth: 170 }}>{perm}:</span>
                      <span style={{ fontSize: "0.82rem", color: "#374151" }}>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">5</span>
              <div className="guide-step__text">
                <div>Quando a conexão cair, o sistema vai mostrar um <strong>link de reconexão</strong> na tela de Conexões. Copie e envie para o responsável pelo WhatsApp — ela reconecta sem precisar acessar o painel.</div>
              </div>
            </li>
          </ol>
        </article>

        {/* Aviso importante */}
        <div className="dashboard-card" style={{ background: "#fffbeb", border: "1px solid #fcd34d", marginTop: 0 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>⚠️</span>
            <div>
              <strong style={{ color: "#92400e", display: "block", marginBottom: 6 }}>Importante: a conexão via QR Code pode cair</strong>
              <p style={{ fontSize: "0.83rem", color: "#78350f", lineHeight: 1.6, margin: 0 }}>
                A conexão via QR Code é prática e barata, mas pode desconectar quando o celular perde internet, o WhatsApp é atualizado ou o chip é trocado. Para clínicas com alto volume de mensagens ou que precisam de estabilidade total, considere a <strong>API Oficial do WhatsApp Business</strong> (mais cara, mas nunca cai). Veja o guia de <a href="/dashboard/academia/reconectar-whatsapp" style={{ color: "#92400e", fontWeight: 600 }}>reconexão</a> para saber o que fazer quando cair.
              </p>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
