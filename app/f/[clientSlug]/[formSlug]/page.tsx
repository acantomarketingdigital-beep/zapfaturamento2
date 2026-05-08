import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeadFormBySlug } from "@/lib/lead-forms";
import { getClinicBySlug } from "@/lib/clinics";
import { LeadFormPublic } from "@/components/LeadFormPublic";
import type { TrackingConfig } from "@/lib/tracking";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ clientSlug: string; formSlug: string }>;
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

export default async function LeadFormPage({ params }: PageProps) {
  const { clientSlug, formSlug } = await params;

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

  return <LeadFormPublic form={form} tracking={tracking} />;
}
