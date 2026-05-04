"use client";

import { useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyButton({
  value,
  label = "Copiar",
  className = "dashboard-button dashboard-button--ghost"
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className={className} onClick={handleCopy}>
      {copied ? "Copiado" : label}
    </button>
  );
}
