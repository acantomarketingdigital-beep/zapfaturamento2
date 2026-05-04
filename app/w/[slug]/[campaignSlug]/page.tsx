import { WhatsAppRedirectFlow } from "@/components/WhatsAppRedirectFlow";
import { WhatsAppRedirectScreen } from "@/components/WhatsAppRedirectScreen";
import { getCampaignBySlug } from "@/lib/campaigns";
import { getClinicBySlug } from "@/lib/clinics";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
    campaignSlug: string;
  }>;
};

export default async function CampaignRedirectPage({ params }: PageProps) {
  const { slug, campaignSlug } = await params;
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
        description="Configure o numero deste cliente no painel para ativar o redirecionamento."
        statusText="Nenhum redirecionamento foi executado."
        isError
      />
    );
  }

  const campaign = await getCampaignBySlug(slug, campaignSlug);

  if (!campaign) {
    return (
      <WhatsAppRedirectScreen
        clientName={client.clientName}
        logoUrl={client.logoUrl}
        title="Campanha nao encontrada."
        description="Verifique o slug da campanha informado na URL."
        statusText="Nenhum redirecionamento foi executado."
        isError
      />
    );
  }

  if (!campaign.isActive) {
    return (
      <WhatsAppRedirectScreen
        clientName={client.clientName}
        logoUrl={client.logoUrl}
        title="Esta campanha esta inativa."
        description="Esta campanha foi desativada no painel administrativo."
        statusText="Nenhum redirecionamento foi executado."
        isError
      />
    );
  }

  return (
    <WhatsAppRedirectFlow
      client={client}
      campaign={{
        id: campaign.id,
        slug: campaign.slug,
        name: campaign.name,
        defaultMessage: campaign.defaultMessage || client.whatsappMessage
      }}
    />
  );
}
