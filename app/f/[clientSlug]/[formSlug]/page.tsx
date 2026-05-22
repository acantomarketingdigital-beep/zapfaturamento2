import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeadFormBySlug } from "@/lib/lead-forms";
import { getClinicBySlug } from "@/lib/clinics";
import { LeadFormPublic } from "@/components/LeadFormPublic";
import type { TrackingConfig } from "@/lib/tracking";
import { generateSeoContent } from "@/lib/seo-content-generator";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ clientSlug: string; formSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { clientSlug, formSlug } = await params;
  const form = await getLeadFormBySlug(clientSlug, formSlug);
  if (!form) return { title: "Formulario" };
  return {
    title: form.title || form.name,
    description: form.subtitle || undefined,
  };
}

export default async function LeadFormPage({ params, searchParams }: PageProps) {
  const { clientSlug, formSlug } = await params;
  const sp = await searchParams;

  const [form, client] = await Promise.all([
    getLeadFormBySlug(clientSlug, formSlug),
    getClinicBySlug(clientSlug),
  ]);

  if (!form) notFound();

  const tracking: TrackingConfig = client ? {
    gtmId:                   client.gtmId        || undefined,
    metaPixelId:             client.metaPixelId  || undefined,
    ga4Id:                   client.ga4Id        || undefined,
    googleAdsId:             client.googleAdsId  || undefined,
    googleAdsConversionLabel: client.googleAdsConversionLabel || undefined,
  } : {};

  // Generate SEO content only for Google Ads forms (same logic as campaign pages).
  // Meta traffic (fbclid) never gets the SEO block — just the form as-is.
  const fbclid = sp.fbclid;
  const utmSrc = typeof sp.utm_source === "string" ? sp.utm_source.toLowerCase() : "";
  const isMetaTraffic = !!(fbclid || utmSrc.includes("facebook") || utmSrc.includes("instagram") || utmSrc.includes("meta"));

  const seoContent =
    !isMetaTraffic && form.campaignSource === "google"
      ? generateSeoContent({
          clientName: client?.clientName ?? form.name,
          seoKeywords: form.seoKeywords,
          seoLocations: form.seoLocations,
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
          seoBullets: form.seoBullets ?? undefined,
        })
      : null;

  return <LeadFormPublic form={form} tracking={tracking} seoContent={seoContent} />;
}
