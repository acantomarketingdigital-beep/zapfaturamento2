import { SmartRedirectPage } from "@/components/SmartRedirectPage";
import { WhatsAppRedirectFlow } from "@/components/WhatsAppRedirectFlow";
import { WhatsAppRedirectScreen } from "@/components/WhatsAppRedirectScreen";
import { getCampaignBySlug } from "@/lib/campaigns";
import { getClinicBySlug } from "@/lib/clinics";
import { generateSeoContent } from "@/lib/seo-content-generator";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string; campaignSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function isMetaTraffic(sp: { [key: string]: string | string[] | undefined }) {
  const fbclid = sp.fbclid;
  const src = typeof sp.utm_source === "string" ? sp.utm_source.toLowerCase() : "";
  return !!(fbclid || src.includes("facebook") || src.includes("instagram") || src.includes("meta"));
}

export default async function CampaignRedirectPage({ params, searchParams }: PageProps) {
  const { slug, campaignSlug } = await params;
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

  const effectiveNumber = campaign.whatsappNumber || client.whatsappNumber;
  const effectiveClient = { ...client, whatsappNumber: effectiveNumber };

  const campaignCtx = {
    id: campaign.id,
    slug: campaign.slug,
    name: campaign.name,
    defaultMessage: campaign.defaultMessage || client.whatsappMessage,
    media1Url: campaign.media1Url,
    media1Type: campaign.media1Type,
    media2Url: campaign.media2Url,
    media2Type: campaign.media2Type,
  };

  if (isMetaTraffic(sp)) {
    return <WhatsAppRedirectFlow client={effectiveClient} campaign={campaignCtx} />;
  }

  const seoContent = campaign.campaignSource === "google"
    ? generateSeoContent({
        clientName: effectiveClient.clientName,
        seoKeywords: campaign.seoKeywords,
        seoLocations: campaign.seoLocations,
        seoTitle: campaign.seoTitle,
        seoDescription: campaign.seoDescription,
        seoBullets: campaign.seoBullets,
      })
    : null;

  return <SmartRedirectPage client={effectiveClient} campaign={campaignCtx} seoContent={seoContent} />;
}
