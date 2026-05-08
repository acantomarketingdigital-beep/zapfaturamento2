"use client";

import { useEffect, useState } from "react";

type Props = {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
};

const STYLES: Record<NonNullable<Props["type"]>, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: "#f0fdf4", border: "#86efac", color: "#15803d", icon: "✓" },
  error:   { bg: "#fef2f2", border: "#fca5a5", color: "#dc2626", icon: "✕" },
  warning: { bg: "#fffbeb", border: "#fcd34d", color: "#92400e", icon: "⚠" },
  info:    { bg: "#eff6ff", border: "#93c5fd", color: "#1d4ed8", icon: "i" },
};

export function FlashMessage({ message, type = "success", duration = 4000 }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!visible || !message) return null;

  const s = STYLES[type];

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        borderRadius: 10,
        padding: "12px 16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        maxWidth: 380,
        fontSize: "0.875rem",
        fontWeight: 500,
        animation: "slideInRight 0.25s ease"
      }}
    >
      <span style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: s.color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.75rem",
        fontWeight: 700,
        flexShrink: 0
      }}>
        {s.icon}
      </span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => setVisible(false)}
        style={{
          background: "none",
          border: "none",
          color: s.color,
          cursor: "pointer",
          fontSize: "1rem",
          lineHeight: 1,
          opacity: 0.6,
          padding: "0 2px"
        }}
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  );
}
