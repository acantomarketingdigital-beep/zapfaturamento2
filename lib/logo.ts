function extractGoogleDriveId(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  const filePathMatch = trimmed.match(/\/file\/d\/([^/]+)/i);

  if (filePathMatch?.[1]) {
    return filePathMatch[1];
  }

  try {
    const url = new URL(trimmed);
    const queryId = url.searchParams.get("id");

    if (queryId) {
      return queryId;
    }

    if (url.hostname.includes("drive.google.com")) {
      const pathMatch = url.pathname.match(/\/uc$/i);
      const ucId = url.searchParams.get("id");

      if (pathMatch && ucId) {
        return ucId;
      }
    }
  } catch {
    return "";
  }

  return "";
}

export function normalizeLogoUrl(value?: string | null) {
  const trimmed = value?.trim() || "";

  if (!trimmed) {
    return "";
  }

  const googleDriveId = extractGoogleDriveId(trimmed);

  if (googleDriveId) {
    return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(
      googleDriveId
    )}`;
  }

  return trimmed;
}

export function getClientInitials(clientName?: string | null) {
  const normalized = clientName?.trim() || "";

  if (!normalized) {
    return "ZF";
  }

  const initials = normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "ZF";
}
