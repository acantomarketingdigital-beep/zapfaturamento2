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
            <h2>Como reconectar o WhatsApp quando cair</h2>
            <p>O que fazer quando a conexao Lite via QR Code se desconecta.</p>
          </div>
        </header>

        <div className="dashboard-notice dashboard-notice--info" style={{ marginBottom: 20 }}>
          <strong>Sobre a conexao Lite:</strong> A conexao via QR Code e pratica e acessivel, mas
          pode desconectar. Quando isso acontecer, o ZapFaturamento avisara os responsaveis para
          reconectar rapidamente.
        </div>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Por que a conexao pode cair?</h3>
          </div>
          <div className="dashboard-summary-list">
            <div>
              <span>1</span>
              <strong>Celular sem internet por muito tempo</strong>
            </div>
            <div>
              <span>2</span>
              <strong>Atualizacao do WhatsApp Business</strong>
            </div>
            <div>
              <span>3</span>
              <strong>Desconexao manual pelo dono do celular</strong>
            </div>
            <div>
              <span>4</span>
              <strong>Troca de celular ou chip</strong>
            </div>
            <div>
              <span>5</span>
              <strong>Reinstalacao do app</strong>
            </div>
            <div>
              <span>6</span>
              <strong>Problema no servidor da Evolution API</strong>
            </div>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Como reconectar quando cair</h3>
          </div>
          <div className="dashboard-summary-list">
            <div><span>Opcao A</span><strong>Pelo painel (recomendado para admins)</strong></div>
            <div>
              <span>1</span>
              <strong>
                Acesse Dashboard → Conexoes WhatsApp → encontre a conexao com status "Desconectado"
              </strong>
            </div>
            <div>
              <span>2</span>
              <strong>Clique em "Conectar / QR Code"</strong>
            </div>
            <div>
              <span>3</span>
              <strong>Escaneie o novo QR Code com o WhatsApp Business</strong>
            </div>
          </div>
          <div className="dashboard-summary-list" style={{ marginTop: 16 }}>
            <div>
              <span>Opcao B</span>
              <strong>Pelo link de reconexao (para secretarias e responsaveis)</strong>
            </div>
            <div>
              <span>1</span>
              <strong>
                O sistema gera um link seguro automaticamente quando a conexao cai
              </strong>
            </div>
            <div>
              <span>2</span>
              <strong>O responsavel recebe o link e acessa no navegador do celular</strong>
            </div>
            <div>
              <span>3</span>
              <strong>A pagina exibe um QR Code para escanear</strong>
            </div>
            <div>
              <span>4</span>
              <strong>Apos escanear, o status volta para "Conectado" automaticamente</strong>
            </div>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Como cadastrar secretarias para reconectar</h3>
          </div>
          <div className="dashboard-summary-list">
            <div>
              <span>1</span>
              <strong>Va em Conexoes WhatsApp e clique em "Responsaveis" na conexao desejada</strong>
            </div>
            <div>
              <span>2</span>
              <strong>Adicione nome, WhatsApp e e-mail de cada secretaria</strong>
            </div>
            <div>
              <span>3</span>
              <strong>Marque "Pode reconectar: Sim"</strong>
            </div>
            <div>
              <span>4</span>
              <strong>
                Quando o WhatsApp cair, copie o link de reconexao e envie para a secretaria
              </strong>
            </div>
            <div>
              <span>5</span>
              <strong>Ela abre o link no celular, escaneia o QR e reconecta sem precisar acessar o painel</strong>
            </div>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Comparacao: API Oficial vs Conexao Lite</h3>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Caracteristica</th>
                  <th>API Oficial</th>
                  <th>Conexao Lite (QR Code)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Estabilidade</td>
                  <td>Alta — nao cai</td>
                  <td>Media — pode desconectar</td>
                </tr>
                <tr>
                  <td>Configuracao</td>
                  <td>Complexa — exige aprovacao Meta</td>
                  <td>Simples — apenas QR Code</td>
                </tr>
                <tr>
                  <td>Custo</td>
                  <td>Pago por mensagem</td>
                  <td>Gratuito (custo do servidor)</td>
                </tr>
                <tr>
                  <td>Indicado para</td>
                  <td>Empresas com alto volume</td>
                  <td>Clinicas e pequenas empresas</td>
                </tr>
                <tr>
                  <td>Reconexao</td>
                  <td>Automatica</td>
                  <td>Manual via QR Code</td>
                </tr>
                <tr>
                  <td>Numero</td>
                  <td>Numero virtual ou fixo</td>
                  <td>WhatsApp Business do celular</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>Boas praticas para evitar quedas</h3>
          </div>
          <div className="dashboard-summary-list">
            <div><strong>Mantenha o celular sempre conectado ao Wi-Fi</strong></div>
            <div><strong>Desative a otimizacao de bateria para o WhatsApp</strong></div>
            <div><strong>Nao remova a conexao manualmente pelo celular sem avisar</strong></div>
            <div><strong>Atualize o WhatsApp Business fora do horario de atendimento</strong></div>
            <div><strong>Cadastre ao menos 2 responsaveis que podem reconectar</strong></div>
            <div><strong>Verifique o status da conexao no painel semanalmente</strong></div>
          </div>
        </article>
      </section>
    </main>
  );
}
