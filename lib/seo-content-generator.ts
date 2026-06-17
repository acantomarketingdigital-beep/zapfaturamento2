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
  locations: string[];
  badgeText: string;
  ctaText: string;
}

export function generateSeoContent(input: SeoInput): SeoContent {
  const primaryKeyword = input.seoKeywords[0] ?? input.clientName;
  const primaryLocation = input.seoLocations[0] ?? "";
  const locationList = input.seoLocations.slice(0, 2).join(" e ");

  // Avoid repeating the city name when it's already present in the keyword.
  // e.g. keyword "limpeza de sofá londrina" + location "Londrina PR" → don't add "em Londrina PR".
  const locationCity = primaryLocation.split(/[\s,]+/)[0].toLowerCase();
  const keywordAlreadyHasCity =
    locationCity.length >= 4 &&
    primaryKeyword.toLowerCase().includes(locationCity);
  const locationSuffix =
    primaryLocation && !keywordAlreadyHasCity ? ` em ${primaryLocation}` : "";

  const title =
    input.seoTitle?.trim() ||
    toTitleCase(`${primaryKeyword}${locationSuffix}`);

  const description =
    input.seoDescription?.trim() ||
    `${toSentenceCase(primaryKeyword)}${locationSuffix} com ${input.clientName}. ` +
      `Atendimento personalizado, resposta rápida e sem compromisso. ` +
      `Chame agora no WhatsApp e seja atendido rapidamente.`;

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
    locations: input.seoLocations,
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
