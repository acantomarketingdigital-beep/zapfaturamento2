import type { Metadata } from "next";
import { PromoLandingPage } from "@/components/PromoLandingPage";
import { getSmsBlastByShortCode } from "@/lib/sms-blasts";
import { getClinicBySlug } from "@/lib/clinics";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ shortCode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shortCode } = await params;
  const blast = await getSmsBlastByShortCode(shortCode);
  if (!blast) return { title: "Promoção" };

  const client = await getClinicBySlug(blast.clientSlug);
  const title = blast.promoTitle ?? `Promoção — ${client?.clientName ?? ""}`;
  const description = blast.promoDescription?.slice(0, 160) ?? title;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: blast.promoImageUrl ? [{ url: blast.promoImageUrl }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: blast.promoImageUrl ? [blast.promoImageUrl] : [],
    },
  };
}

export default async function PromoPage({ params }: Props) {
  const { shortCode } = await params;
  const blast = await getSmsBlastByShortCode(shortCode);

  if (!blast || !blast.isActive) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <p style={{ fontSize: "1.1rem", color: "#6b7280" }}>Esta promoção não está disponível no momento.</p>
        </div>
      </main>
    );
  }

  const client = await getClinicBySlug(blast.clientSlug);
  const whatsappNumber = blast.whatsappNumber || client?.whatsappNumber || "";

  return (
    <PromoLandingPage
      clientName={client?.clientName ?? blast.clientSlug}
      clientLogoUrl={client?.logoUrl ?? null}
      promoImageUrl={blast.promoImageUrl}
      promoImageAspect={blast.promoImageAspect}
      promoTitle={blast.promoTitle}
      promoDescription={blast.promoDescription}
      ctaText={blast.ctaText}
      whatsappNumber={whatsappNumber}
      whatsappMessage={blast.whatsappMessage}
      shortCode={shortCode}
    />
  );
}
