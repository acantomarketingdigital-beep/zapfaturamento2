import { ReconnectPage } from "@/components/dashboard/ReconnectPage";
import { getConnectionByReconnectToken } from "@/lib/whatsapp-connections";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function ReconectarPage({ params }: Props) {
  const { token } = await params;
  const connection = await getConnectionByReconnectToken(token);

  if (!connection) {
    return (
      <main className="reconnect-shell">
        <div className="reconnect-card">
          <div className="dashboard-alert dashboard-alert--error">
            Link de reconexao invalido ou expirado. Solicite um novo link ao administrador do sistema.
          </div>
        </div>
      </main>
    );
  }

  return (
    <ReconnectPage
      token={token}
      connectionName={connection.connection_name}
      clientName={connection.client_name ?? connection.client_slug}
    />
  );
}
