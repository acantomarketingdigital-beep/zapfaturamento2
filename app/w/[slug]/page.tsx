import { SmartRedirectPage } from "@/components/SmartRedirectPage";
import { WhatsAppRedirectFlow } from "@/components/WhatsAppRedirectFlow";
import { WhatsAppRedirectScreen } from "@/components/WhatsAppRedirectScreen";
import { getClinicBySlug } from "@/lib/clinics";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function isMetaTraffic(sp: { [key: string]: string | string[] | undefined }) {
  const fbclid = sp.fbclid;
  const src = typeof sp.utm_source === "string" ? sp.utm_source.toLowerCase() : "";
  return !!(fbclid || src.includes("facebook") || src.includes("instagram") || src.includes("meta"));
}

export default async function RedirectPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
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
        description="Configure o numero deste cliente no painel ou em lib/clients.ts para ativar o redirecionamento."
        statusText="Nenhum redirecionamento foi executado."
        isError
      />
    );
  }

  if (isMetaTraffic(sp)) {
    return <WhatsAppRedirectFlow client={client} />;
  }

  return <SmartRedirectPage client={client} />;
}
