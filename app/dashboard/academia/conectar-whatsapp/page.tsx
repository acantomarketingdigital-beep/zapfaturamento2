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
            <h2>Como conectar seu WhatsApp ao ZapFaturamento</h2>
            <p>Guia passo a passo para ativar a Conexao Lite via QR Code.</p>
          </div>
        </header>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Parte 1 — Subir a Evolution API</h3>
          </div>
          <p className="dashboard-helper">
            A conexao via QR Code exige um servidor separado rodando a{" "}
            <strong>Evolution API</strong>. Ela e open source e pode ser hospedada em um VPS,
            Railway, Render ou qualquer servidor com Node.js/Docker.
          </p>
          <div className="dashboard-summary-list" style={{ marginTop: 14 }}>
            <div><span>1</span><strong>Acesse github.com/EvolutionAPI/evolution-api</strong></div>
            <div><span>2</span><strong>Siga o guia de instalacao com Docker ou Node.js</strong></div>
            <div>
              <span>3</span>
              <strong>
                Configure o arquivo .env com AUTHENTICATION_API_KEY (sua chave de acesso)
              </strong>
            </div>
            <div><span>4</span><strong>Suba o servico e anote a URL publica (ex: https://api.seudominio.com)</strong></div>
            <div>
              <span>5</span>
              <strong>
                No painel da Vercel, adicione as variaveis:
                EVOLUTION_API_URL e EVOLUTION_API_KEY
              </strong>
            </div>
            <div>
              <span>6</span>
              <strong>
                Configure o webhook na Evolution API apontando para:
                https://seu-dominio.vercel.app/api/whatsapp/webhook
              </strong>
            </div>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Parte 2 — Conectar o WhatsApp</h3>
          </div>
          <div className="dashboard-summary-list">
            <div><span>1</span><strong>Acesse Dashboard → Conexoes WhatsApp</strong></div>
            <div><span>2</span><strong>Clique em "+ Nova Conexao"</strong></div>
            <div><span>3</span><strong>Preencha o nome da conexao (ex: WhatsApp Principal)</strong></div>
            <div><span>4</span><strong>Clique em "Criar e conectar" — o QR Code sera exibido</strong></div>
            <div><span>5</span><strong>Abra o WhatsApp Business no celular</strong></div>
            <div><span>6</span><strong>Va em Menu (tres pontos) → Aparelhos conectados</strong></div>
            <div><span>7</span><strong>Toque em "Conectar aparelho"</strong></div>
            <div><span>8</span><strong>Aponte a camera para o QR Code na tela</strong></div>
            <div><span>9</span><strong>Aguarde o status mudar para "Conectado"</strong></div>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Variaveis de ambiente necessarias</h3>
          </div>
          <div className="dashboard-summary-list">
            <div>
              <span>EVOLUTION_API_URL</span>
              <strong>URL base da Evolution API (sem / no final)</strong>
            </div>
            <div>
              <span>EVOLUTION_API_KEY</span>
              <strong>Chave de acesso configurada na Evolution API</strong>
            </div>
            <div>
              <span>EVOLUTION_WEBHOOK_SECRET</span>
              <strong>Segredo opcional para validar autenticidade dos webhooks</strong>
            </div>
          </div>
          <div className="dashboard-notice dashboard-notice--info" style={{ marginTop: 14 }}>
            Apos configurar as variaveis, faca um novo deploy na Vercel para ativar.
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Como cadastrar responsaveis pela conexao</h3>
          </div>
          <div className="dashboard-summary-list">
            <div><span>1</span><strong>Abra a conexao desejada em Conexoes WhatsApp</strong></div>
            <div><span>2</span><strong>Clique em "Responsaveis"</strong></div>
            <div><span>3</span><strong>Adicione nome, WhatsApp e e-mail de cada responsavel</strong></div>
            <div>
              <span>4</span>
              <strong>
                Defina se podem reconectar, ver o Inbox e responder mensagens
              </strong>
            </div>
            <div>
              <span>5</span>
              <strong>
                Quando o WhatsApp cair, o link de reconexao ficara disponivel na tela de Conexoes
              </strong>
            </div>
          </div>
        </article>

        <div className="dashboard-notice dashboard-notice--info">
          <strong>Importante:</strong> A conexao via QR Code e pratica e acessivel, mas pode
          desconectar quando o celular perde internet, o app e atualizado ou o numero e desconectado
          manualmente. Para negocio de alto volume, considere a API Oficial do WhatsApp Business.
        </div>
      </section>
    </main>
  );
}
