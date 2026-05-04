import { notFound } from "next/navigation";
import { GroupJoinPage } from "@/components/GroupJoinPage";
import { getGroupCampaign } from "@/lib/group-campaigns";
import { getClinicBySlug, getClinicBackendConfigBySlug } from "@/lib/clinics";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ clientSlug: string; campaignSlug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { clientSlug } = await params;
  const client = await getClinicBySlug(clientSlug);
  return {
    title: client ? `${client.clientName} — Grupo WhatsApp` : "Grupo WhatsApp",
    robots: "noindex"
  };
}

export default async function GroupPage({ params }: PageProps) {
  const { clientSlug, campaignSlug } = await params;

  const [campaign, client, clientServer] = await Promise.all([
    getGroupCampaign(clientSlug, campaignSlug),
    getClinicBySlug(clientSlug),
    getClinicBackendConfigBySlug(clientSlug)
  ]);

  if (!campaign || !client) notFound();

  return (
    <GroupJoinPage
      clientSlug={clientSlug}
      campaignSlug={campaignSlug}
      campaignName={campaign.name}
      clientName={client.clientName}
      groupUrl={campaign.group_url}
      logoUrl={client.logoUrl ?? null}
      pixelId={clientServer?.metaPixelId ?? null}
    />
  );
}
