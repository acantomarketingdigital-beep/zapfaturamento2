"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  intervalSeconds?: number;
};

export function AutoRefresh({ intervalSeconds = 30 }: Props) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(intervalSeconds);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [active, setActive] = useState(true);
  const remainingRef = useRef(intervalSeconds);

  useEffect(() => {
    if (!active) return;

    remainingRef.current = intervalSeconds;
    setRemaining(intervalSeconds);

    const countdown = setInterval(() => {
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);

      if (remainingRef.current <= 0) {
        router.refresh();
        setLastRefresh(new Date());
        remainingRef.current = intervalSeconds;
        setRemaining(intervalSeconds);
      }
    }, 1000);

    return () => clearInterval(countdown);
  }, [active, intervalSeconds, router]);

  const pct = Math.round((remaining / intervalSeconds) * 100);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: "0.78rem",
      color: "var(--muted)",
      userSelect: "none"
    }}>
      {/* Circular progress */}
      <div
        title={`Atualiza em ${remaining}s`}
        style={{ position: "relative", width: 26, height: 26, flexShrink: 0, cursor: "pointer" }}
        onClick={() => { router.refresh(); setLastRefresh(new Date()); setRemaining(intervalSeconds); remainingRef.current = intervalSeconds; }}
      >
        <svg width="26" height="26" viewBox="0 0 26 26" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="13" cy="13" r="10" fill="none" stroke="var(--border)" strokeWidth="2.5" />
          <circle
            cx="13" cy="13" r="10"
            fill="none"
            stroke={active ? "var(--brand)" : "#9ca3af"}
            strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 10}`}
            strokeDashoffset={`${2 * Math.PI * 10 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.9s linear" }}
          />
        </svg>
        {/* Refresh icon in center */}
        <svg
          viewBox="0 0 20 20" fill="currentColor"
          style={{ position: "absolute", inset: 0, margin: "auto", width: 12, height: 12, color: active ? "var(--brand)" : "#9ca3af" }}
        >
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      </div>

      <div style={{ lineHeight: 1.4 }}>
        <div>
          {active ? `Atualiza em ${remaining}s` : "Auto-refresh pausado"}
          {lastRefresh && (
            <span style={{ marginLeft: 6, opacity: 0.6 }}>
              · {lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => setActive((a) => !a)}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(30,41,59,0.8)",
          borderRadius: 6,
          padding: "2px 8px",
          fontSize: "0.72rem",
          cursor: "pointer",
          color: "#64748b"
        }}
      >
        {active ? "Pausar" : "Retomar"}
      </button>
    </div>
  );
}
