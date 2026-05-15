import { SmartRedirectPage } from "@/components/SmartRedirectPage";
import { WhatsAppRedirectFlow } from "@/components/WhatsAppRedirectFlow";
import { WhatsAppRedirectScreen } from "@/components/WhatsAppRedirectScreen";
import { getCampaignBySlug } from "@/lib/campaigns";
import { getCreativeBySlug } from "@/lib/campaign-creatives";
import { getClinicBySlug } from "@/lib/clinics";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string; campaignSlug: string; creativeSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function isMetaTraffic(sp: { [key: string]: string | string[] | undefined }) {
  const fbclid = sp.fbclid;
  const src = typeof sp.utm_source === "string" ? sp.utm_source.toLowerCase() : "";
  return !!(fbclid || src.includes("facebook") || src.includes("instagram") || src.includes("meta"));
}

export default async function CreativeRedirectPage({ params, searchParams }: PageProps) {
  const { slug, campaignSlug, creativeSlug } = await params;
  const sp = await searchParams;
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
        description="Este link foi desativado no painel administrativo."
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

  const creative = await getCreativeBySlug(campaign.id, creativeSlug);

  if (!creative) {
    return (
      <WhatsAppRedirectScreen
        clientName={client.clientName}
        logoUrl={client.logoUrl}
        title="Criativo nao encontrado."
        description="Verifique o slug do criativo informado na URL."
        statusText="Nenhum redirecionamento foi executado."
        isError
      />
    );
  }

  if (!creative.isActive) {
    return (
      <WhatsAppRedirectScreen
        clientName={client.clientName}
        logoUrl={client.logoUrl}
        title="Este criativo esta inativo."
        description="Este criativo foi desativado no painel administrativo."
        statusText="Nenhum redirecionamento foi executado."
        isError
      />
    );
  }

  const resolvedMessage =
    creative.defaultMessage?.trim() ||
    campaign.defaultMessage?.trim() ||
    client.whatsappMessage;

  const campaignCtx = {
    id: campaign.id,
    slug: campaign.slug,
    name: campaign.name,
    defaultMessage: resolvedMessage,
  };

  const creativeCtx = { id: creative.id, slug: creative.slug };

  if (isMetaTraffic(sp)) {
    return (
      <WhatsAppRedirectFlow
        client={client}
        campaign={campaignCtx}
        creative={creativeCtx}
      />
    );
  }

  return (
    <SmartRedirectPage
      client={client}
      campaign={campaignCtx}
      creative={creativeCtx}
    />
  );
}
