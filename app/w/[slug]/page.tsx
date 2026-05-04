import { WhatsAppRedirectFlow } from "@/components/WhatsAppRedirectFlow";
import { WhatsAppRedirectScreen } from "@/components/WhatsAppRedirectScreen";
import { getClinicBySlug } from "@/lib/clinics";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function RedirectPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await getClinicBySlug(slug);

  if (!client) {
    return (
      <WhatsAppRedirectScreen
        title="Cliente nao encontrado."
        description="Verifique o slug informado na URL antes de publicar a campanha."
        statusText="Nenhum redirecionamento foi executado."
        isError
      />
    );
  }

  if (!client.isActive) {
    return (
      <WhatsAppRedirectScreen
        clientName={client.clientName}
        logoUrl={client.logoUrl}
        title="Este cliente esta inativo."
        description="Este link foi desativado no painel administrativo e nao esta aceitando novos redirecionamentos."
        statusText="Nenhum redirecionamento foi executado."
        isError
      />
    );
  }

  if (!client.whatsappNumber) {
    return (
      <WhatsAppRedirectScreen
        clientName={client.clientName}
        logoUrl={client.logoUrl}
        title="Numero de WhatsApp nao configurado."
        description="Configure o numero deste cliente no painel ou em lib/clients.ts para ativar o redirecionamento."
        statusText="Nenhum redirecionamento foi executado."
        isError
      />
    );
  }

  return <WhatsAppRedirectFlow client={client} />;
}
