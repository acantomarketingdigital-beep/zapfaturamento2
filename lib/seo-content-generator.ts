// Gerador de conteúdo SEO para SmartRedirectPage — Google Ads only.
// Função pura, sem efeitos colaterais. NÃO usar no fluxo Meta.

export interface SeoInput {
  clientName: string;
  seoKeywords: string[];
  seoLocations: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoBullets?: string[] | null;
  seoCta?: string | null;
  seoBadgeText?: string | null;
}

export interface SeoContent {
  title: string;
  description: string;
  bullets: string[];
  keywords: string[];
  badgeText: string;
  ctaText: string;
}

export function generateSeoContent(input: SeoInput): SeoContent {
  const primaryKeyword = input.seoKeywords[0] ?? input.clientName;
  const primaryLocation = input.seoLocations[0] ?? "";
  const locationList = input.seoLocations.slice(0, 2).join(" e ");

  const title =
    input.seoTitle?.trim() ||
    toTitleCase(
      primaryLocation
        ? `${primaryKeyword} em ${primaryLocation}`
        : primaryKeyword
    );

  const description =
    input.seoDescription?.trim() ||
    `${toSentenceCase(primaryKeyword)}${primaryLocation ? ` em ${primaryLocation}` : ""} com ${input.clientName}. ` +
      `Atendimento personalizado, resposta rápida e sem compromisso. ` +
      `Fale agora pelo WhatsApp e receba seu orçamento grátis.`;

  const bullets =
    input.seoBullets && input.seoBullets.length >= 3
      ? input.seoBullets
      : [
          locationList ? `Atendemos ${locationList}` : `Atendimento na sua região`,
          `Orçamento grátis pelo WhatsApp`,
          `Resposta rápida da equipe ${input.clientName}`,
          `Sem compromisso, fale agora`,
        ];

  const badgeText =
    input.seoBadgeText?.trim() ||
    (primaryLocation ? `Atendimento em ${primaryLocation}` : `Fale agora pelo WhatsApp`);

  const ctaText = input.seoCta?.trim() || "Falar no WhatsApp agora";

  return {
    title,
    description,
    bullets,
    keywords: input.seoKeywords,
    badgeText,
    ctaText,
  };
}

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
}

function toSentenceCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
