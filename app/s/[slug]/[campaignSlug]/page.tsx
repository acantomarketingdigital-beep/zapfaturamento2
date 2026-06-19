import { SmsRedirectFlow } from "@/components/SmsRedirectFlow";
import { SmsRedirectPage } from "@/components/SmsRedirectPage";
import { WhatsAppRedirectScreen } from "@/components/WhatsAppRedirectScreen";
import { getCampaignBySlug } from "@/lib/campaigns";
import { getClinicBySlug } from "@/lib/clinics";

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

export default async function SmsCampaignRedirectPage({ params, searchParams }: PageProps) {
  const { slug, campaignSlug } = await params;
  const sp = await searchParams;
  const client = await getClinicBySlug(slug);

  if (!client) {
    return (
      <WhatsAppRedirectScreen
        title="Client not found."
        description="Check the slug in the URL before publishing the campaign."
        statusText="No redirect was executed."
        isError
      />
    );
  }

  if (!client.isActive) {
    return (
      <WhatsAppRedirectScreen
        clientName={client.clientName}
        logoUrl={client.logoUrl}
        title="This client is inactive."
        description="This link was deactivated in the admin panel."
        statusText="No redirect was executed."
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
        title="Campaign not found."
        description="Check the campaign slug in the URL."
        statusText="No redirect was executed."
        isError
      />
    );
  }

  if (!campaign.isActive) {
    return (
      <WhatsAppRedirectScreen
        clientName={client.clientName}
        logoUrl={client.logoUrl}
        title="This campaign is inactive."
        description="This campaign was deactivated in the admin panel."
        statusText="No redirect was executed."
        isError
      />
    );
  }

  if (campaign.channel !== "sms" || !campaign.smsPhone) {
    return (
      <WhatsAppRedirectScreen
        clientName={client.clientName}
        logoUrl={client.logoUrl}
        title="SMS not configured."
        description="This campaign does not have an SMS phone number configured."
        statusText="No redirect was executed."
        isError
      />
    );
  }

  const campaignCtx = {
    id: campaign.id,
    slug: campaign.slug,
    name: campaign.name,
    defaultMessage: campaign.defaultMessage,
    media1Url: campaign.media1Url,
    media1Type: campaign.media1Type,
    media2Url: campaign.media2Url,
    media2Type: campaign.media2Type,
  };

  if (isMetaTraffic(sp)) {
    return (
      <SmsRedirectFlow
        client={client}
        campaign={campaignCtx}
        smsPhone={campaign.smsPhone}
        smsMessage={campaign.defaultMessage}
      />
    );
  }

  return (
    <SmsRedirectPage
      client={client}
      campaign={campaignCtx}
      smsPhone={campaign.smsPhone}
      smsMessage={campaign.defaultMessage}
    />
  );
}
