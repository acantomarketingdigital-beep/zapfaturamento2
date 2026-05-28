import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

export default async function AcademiaReconectarWhatsappPage() {
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
            <h2>WhatsApp caiu — o que fazer agora</h2>
            <p>Passo a passo para reconectar rapidamente e evitar que os leads fiquem sem atendimento.</p>
          </div>
        </header>

        {/* Alerta de urgência */}
        <div className="dashboard-card" style={{ background: "#fef2f2", border: "1px solid #fecaca", marginTop: 0 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>🚨</span>
            <div>
              <strong style={{ color: "#991b1b", display: "block", marginBottom: 6 }}>O WhatsApp está desconectado — cada minuto conta</strong>
              <p style={{ fontSize: "0.83rem", color: "#7f1d1d", lineHeight: 1.6, margin: "0 0 8px" }}>
                Enquanto a conexão está caída, os leads que clicarem no anúncio não conseguem enviar mensagem e o Kanban para de funcionar. Reconecte o mais rápido possível.
              </p>
              <a
                href="#reconectar"
                style={{ fontSize: "0.85rem", fontWeight: 700, color: "#dc2626", textDecoration: "underline" }}
              >
                → Ir direto para o passo a passo de reconexão
              </a>
            </div>
          </div>
        </div>

        {/* Por que cai */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Por que a conexão pode cair?</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: "📵", cause: "Celular ficou sem internet por muito tempo", fix: "Mantenha o celular sempre conectado ao Wi-Fi" },
              { icon: "🔄", cause: "Atualização do WhatsApp Business", fix: "Atualize fora do horário de pico (madrugada ou fim de semana)" },
              { icon: "🔋", cause: "Bateria do celular descarregou ou app foi fechado pelo SO", fix: "Desative a otimização de bateria para o WhatsApp" },
              { icon: "📱", cause: "O dono do celular desconectou manualmente", fix: "Avise que não pode remover a conexão do WhatsApp sem avisar" },
              { icon: "🔃", cause: "Troca de celular ou de chip", fix: "Reconecte após qualquer troca de dispositivo" },
              { icon: "⚙️", cause: "Problema no servidor da Evolution API", fix: "Verifique se o servidor está rodando" },
            ].map((item) => (
              <div key={item.cause} style={{ display: "flex", gap: 12, background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.cause}</div>
                  <div style={{ fontSize: "0.78rem", color: "#15803d", marginTop: 3 }}>
                    <strong>Prevenção:</strong> {item.fix}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Reconectar */}
        <div className="dashboard-section-divider" id="reconectar"><span>Como reconectar agora</span></div>

        <div className="dashboard-detail-grid">

          <article className="dashboard-card" style={{ borderLeft: "3px solid #1d4ed8" }}>
            <div className="dashboard-card__header">
              <div>
                <h3>Opção A — Pelo painel do sistema</h3>
                <span style={{ fontSize: "0.75rem", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: 6, padding: "1px 8px", fontWeight: 600 }}>Para admins</span>
              </div>
            </div>
            <ol className="guide-steps">
              <li className="guide-step">
                <span className="guide-step__num">1</span>
                <div className="guide-step__text">
                  <div>No menu esquerdo, clique em <strong>Conexões WhatsApp</strong>.</div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">2</span>
                <div className="guide-step__text">
                  <div>Encontre a conexão com status <strong style={{ color: "#dc2626" }}>Desconectado</strong>.</div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">3</span>
                <div className="guide-step__text">
                  <div>Clique em <strong>&ldquo;Conectar / QR Code&rdquo;</strong>.</div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">4</span>
                <div className="guide-step__text">
                  <div>Abra o WhatsApp Business no celular → <strong>Três pontinhos → Aparelhos conectados → Conectar aparelho</strong>.</div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">5</span>
                <div className="guide-step__text">
                  <div>Aponte a câmera para o QR Code na tela. Aguarde o status mudar para <strong style={{ color: "#15803d" }}>Conectado</strong>.</div>
                </div>
              </li>
            </ol>
          </article>

          <article className="dashboard-card" style={{ borderLeft: "3px solid #7c3aed" }}>
            <div className="dashboard-card__header">
              <div>
                <h3>Opção B — Pelo link de reconexão</h3>
                <span style={{ fontSize: "0.75rem", background: "#f5f3ff", border: "1px solid #c4b5fd", color: "#6d28d9", borderRadius: 6, padding: "1px 8px", fontWeight: 600 }}>Para secretárias</span>
              </div>
            </div>
            <p className="dashboard-helper">
              A secretária reconecta pelo celular dela, sem precisar acessar o painel de administração.
            </p>
            <ol className="guide-steps">
              <li className="guide-step">
                <span className="guide-step__num">1</span>
                <div className="guide-step__text">
                  <div>Quando a conexão cair, o sistema gera um <strong>link de reconexão seguro</strong> automaticamente.</div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">2</span>
                <div className="guide-step__text">
                  <div>O admin copia esse link em <strong>Conexões WhatsApp</strong> e envia para a secretária pelo WhatsApp.</div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">3</span>
                <div className="guide-step__text">
                  <div>A secretária abre o link no navegador do celular dela — aparece a página com o QR Code.</div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">4</span>
                <div className="guide-step__text">
                  <div>Ela abre o WhatsApp Business do número da clínica → <strong>Aparelhos conectados → Conectar aparelho</strong> → aponta para o QR Code.</div>
                </div>
              </li>
              <li className="guide-step">
                <span className="guide-step__num">5</span>
                <div className="guide-step__text">
                  <div>Status volta para <strong style={{ color: "#15803d" }}>Conectado</strong> automaticamente.</div>
                </div>
              </li>
            </ol>
          </article>
        </div>

        {/* Como cadastrar responsáveis */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Como preparar a secretária para reconectar sozinha</h3>
          </div>
          <p className="dashboard-helper">
            Configure isso com antecedência — antes da conexão cair. Assim quando acontecer, ela já sabe o que fazer.
          </p>
          <ol className="guide-steps">
            <li className="guide-step">
              <span className="guide-step__num">1</span>
              <div className="guide-step__text">
                <div>Em <strong>Conexões WhatsApp</strong>, clique na conexão e depois em <strong>&ldquo;Responsáveis&rdquo;</strong>.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">2</span>
              <div className="guide-step__text">
                <div>Adicione o nome, WhatsApp e e-mail da secretária.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">3</span>
              <div className="guide-step__text">
                <div>Em <strong>&ldquo;Pode reconectar&rdquo;</strong>, selecione <strong>Sim</strong>.</div>
              </div>
            </li>
            <li className="guide-step">
              <span className="guide-step__num">4</span>
              <div className="guide-step__text">
                <div>Salve. Quando a conexão cair, basta copiar o link de reconexão na tela de Conexões e enviar para ela.</div>
              </div>
            </li>
          </ol>
          <div className="guide-tip guide-tip--info" style={{ marginTop: 4 }}>
            Cadastre sempre pelo menos 2 pessoas que podem reconectar — admin e secretária. Assim você não fica dependendo de uma única pessoa.
          </div>
        </article>

        {/* Boas práticas */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Como evitar quedas desnecessárias</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Mantenha o celular sempre conectado ao Wi-Fi (não só ao 4G)",
              "Plugue o celular na tomada o dia todo — bateria baixa fecha o WhatsApp",
              "Desative a otimização de bateria para o WhatsApp: Configurações → Bateria → WhatsApp → Sem restrições",
              "Não remova o WhatsApp de 'Aparelhos conectados' sem avisar primeiro",
              "Atualize o WhatsApp Business fora do horário comercial (ex: depois das 20h)",
              "Verifique o status da conexão no painel toda segunda-feira de manhã",
              "Cadastre ao menos 2 responsáveis que podem reconectar",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--bg-soft, #f9fafb)", border: "1px solid var(--border)", borderRadius: 7, padding: "9px 12px" }}>
                <span style={{ color: "#15803d", fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: "0.83rem" }}>{tip}</span>
              </div>
            ))}
          </div>
        </article>

        {/* Comparação */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Comparação: Conexão Lite (QR Code) vs. API Oficial</h3>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Característica</th>
                  <th>Conexão Lite (QR Code)</th>
                  <th>API Oficial (WhatsApp Business API)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Estabilidade</td>
                  <td>Média — pode desconectar</td>
                  <td style={{ color: "#15803d", fontWeight: 500 }}>Alta — praticamente não cai</td>
                </tr>
                <tr>
                  <td>Configuração</td>
                  <td style={{ color: "#15803d", fontWeight: 500 }}>Simples — só QR Code</td>
                  <td>Complexa — aprovação pela Meta</td>
                </tr>
                <tr>
                  <td>Custo</td>
                  <td style={{ color: "#15803d", fontWeight: 500 }}>Gratuito (só custo do servidor)</td>
                  <td>Pago por mensagem enviada</td>
                </tr>
                <tr>
                  <td>Reconexão quando cai</td>
                  <td>Manual — precisa escanear QR Code</td>
                  <td style={{ color: "#15803d", fontWeight: 500 }}>Automática</td>
                </tr>
                <tr>
                  <td>Número usado</td>
                  <td>WhatsApp Business do celular existente</td>
                  <td>Número virtual ou novo</td>
                </tr>
                <tr>
                  <td>Ideal para</td>
                  <td style={{ color: "#15803d", fontWeight: 500 }}>Clínicas e pequenos negócios</td>
                  <td>Empresas com alto volume de mensagens</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="guide-tip" style={{ marginTop: 12 }}>
            Para a maioria das clínicas, a Conexão Lite funciona muito bem. A API Oficial é para quem recebe centenas de mensagens por dia e não pode ter nem 5 minutos de instabilidade.
          </div>
        </article>

      </section>
    </main>
  );
}
