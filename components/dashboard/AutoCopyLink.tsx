"use client";

import { useEffect, useState } from "react";

type AutoCopyLinkProps = {
  value?: string;
};

export function AutoCopyLink({ value }: AutoCopyLinkProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (!value) {
      return;
    }

    let cancelled = false;

    void navigator.clipboard
      .writeText(value)
      .then(() => {
        if (!cancelled) {
          setStatus("copied");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!value || status === "idle") {
    return null;
  }

  return (
    <div
      className={`dashboard-alert ${
        status === "copied"
          ? "dashboard-alert--success"
          : "dashboard-alert--error"
      }`}
    >
      {status === "copied"
        ? "Link copiado para a area de transferencia."
        : "Nao foi possivel copiar automaticamente. Use o botao copiar."}
    </div>
  );
}
