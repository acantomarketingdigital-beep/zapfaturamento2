"use client";

import { useEffect, useMemo, useState } from "react";
import { getClientInitials, normalizeLogoUrl } from "@/lib/logo";

type CustomerLogoProps = {
  logoUrl?: string | null;
  clientName: string;
  alt?: string;
  imageClassName: string;
  placeholderClassName: string;
  onStatusChange?: (status: "loaded" | "error" | "empty") => void;
};

export function CustomerLogo({
  logoUrl,
  clientName,
  alt,
  imageClassName,
  placeholderClassName,
  onStatusChange
}: CustomerLogoProps) {
  const normalizedLogoUrl = useMemo(() => normalizeLogoUrl(logoUrl), [logoUrl]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [normalizedLogoUrl]);

  useEffect(() => {
    if (!normalizedLogoUrl) {
      onStatusChange?.("empty");
      return;
    }

    if (hasError) {
      onStatusChange?.("error");
      return;
    }

    onStatusChange?.("loaded");
  }, [hasError, normalizedLogoUrl, onStatusChange]);

  if (!normalizedLogoUrl || hasError) {
    return (
      <div className={placeholderClassName} aria-label={`Iniciais de ${clientName}`}>
        {getClientInitials(clientName)}
      </div>
    );
  }

  return (
    <img
      src={normalizedLogoUrl}
      alt={alt || `Logo de ${clientName}`}
      className={imageClassName}
      onError={() => setHasError(true)}
      onLoad={() => onStatusChange?.("loaded")}
    />
  );
}
