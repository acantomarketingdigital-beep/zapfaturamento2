"use client";

import { useEffect, useMemo, useState } from "react";
import type { ResolvedClientConfig } from "@/lib/clients";
import { buildLeadCapturePayload } from "@/lib/utm";
import { initializeTracking, trackSmsRedirectEvent, trackRedirectPageView } from "@/lib/tracking";
import { SmsRedirectScreen } from "./SmsRedirectScreen";
import { SmsRedirectPage } from "./SmsRedirectPage";

type CampaignContext = {
  id: string;
  slug: string;
  name: string;
  defaultMessage: string;
  media1Url?: string | null;
  media1Type?: "image" | "video" | null;
  media2Url?: string | null;
  media2Type?: "image" | "video" | null;
};

type CreativeContext = { id: string; slug: string };

type Props = {
  client: ResolvedClientConfig;
  campaign?: CampaignContext;
  creative?: CreativeContext;
  smsPhone: string;
  smsMessage: string;
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function createEventId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `sms-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readCookie(name: string): string {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

async function sendLeadToBackend(payload: Record<string, unknown>) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2000);
  try {
    await fetch("/api/kommo/create-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, skipCapi: true }),
      signal: controller.signal,
    });
  } catch { /* best-effort */ }
  finally { window.clearTimeout(timeoutId); }
}

function getLocaleStrings(locale: "en" | "pt", isMessenger: boolean) {
  if (isMessenger) {
    return locale === "en"
      ? { statusInitial: "Preparing your conversation...", statusMid: "Almost there! Opening Messenger...", statusLate: "Opening the conversation...", statusFinal: "Opening Messenger..." }
      : { statusInitial: "Preparando seu atendimento...", statusMid: "Quase lá! Abrindo o Messenger...", statusLate: "Abrindo a conversa...", statusFinal: "Abrindo o Messenger..." };
  }
  return locale === "en"
    ? { statusInitial: "Preparing your conversation...", statusMid: "Almost there! Opening SMS...", statusLate: "Opening the conversation...", statusFinal: "Opening SMS app..." }
    : { statusInitial: "Preparando seu atendimento...", statusMid: "Quase lá! Abrindo o SMS...", statusLate: "Abrindo a conversa...", statusFinal: "Abrindo o app de SMS..." };
}

function detectLocale(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length >= 10 && digits.length <= 11) return "en" as const;
  return "pt" as const;
}

export function SmsRedirectFlow({ client, campaign, creative, smsPhone, smsMessage }: Props) {
  const [statusText, setStatusText] = useState("");
  const [redirectUrl, setRedirectUrl] = useState<string | undefined>(undefined);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  const locale = detectLocale(smsPhone);

  const stableDelay = useMemo(() => {
    const candidate = client.redirectDelay ?? 2000;
    if (candidate < 1500) return 1500;
    if (candidate > 5000) return 5000;
    return candidate;
  }, [client.redirectDelay]);

  useEffect(() => {
    const mobile = isMobileDevice();
    setIsMobile(mobile);

    const digits = smsPhone.replace(/\D/g, "");
    const resolvedSmsUrl = `sms:+${digits}${smsMessage ? `?body=${encodeURIComponent(smsMessage)}` : ""}`;

    // Desktop with Messenger configured → redirect to Messenger
    // Desktop without Messenger → show landing page (no effect needed)
    const isMessenger = !mobile && Boolean(client.messengerUrl);
    const resolvedRedirectUrl = mobile ? resolvedSmsUrl : (client.messengerUrl || null);

    if (!resolvedRedirectUrl) return;

    const t = getLocaleStrings(locale, isMessenger);

    setRedirectUrl(resolvedRedirectUrl);
    setStatusText(t.statusInitial);

    let cancelled = false;

    const url = new URL(window.location.href);
    const eventId = createEventId();

    const basePayload = buildLeadCapturePayload({
      client, url,
      redirectUrl: resolvedRedirectUrl,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      eventId, campaign, creative,
    });

    history.replaceState(null, "", window.location.pathname);

    const payload = {
      ...basePayload,
      redirectUrl: resolvedRedirectUrl,
      fbp: readCookie("_fbp"),
      fbc: readCookie("_fbc"),
    };

    initializeTracking(client);
    trackRedirectPageView(client, basePayload);

    const capturePromise = sendLeadToBackend(payload as Record<string, unknown>);

    void (async () => {
      await Promise.allSettled([
        wait(stableDelay),
        Promise.race([capturePromise, wait(2000)]),
      ]);

      if (cancelled) return;

      setStatusText(t.statusFinal);
      trackSmsRedirectEvent(client, payload as Parameters<typeof trackSmsRedirectEvent>[1]);
      await wait(120);

      if (!cancelled) {
        window.location.href = resolvedRedirectUrl;
      }
    })();

    const midTimer = window.setTimeout(() => {
      if (!cancelled) setStatusText(t.statusMid);
    }, 700);

    const lateTimer = window.setTimeout(() => {
      if (!cancelled) setStatusText(t.statusLate);
    }, Math.max(stableDelay - 500, 1000));

    return () => {
      cancelled = true;
      window.clearTimeout(midTimer);
      window.clearTimeout(lateTimer);
    };
  }, [client, campaign, creative, smsPhone, smsMessage, stableDelay, locale]);

  // Desktop without Messenger: show the full landing page with button
  if (isMobile === false && !client.messengerUrl) {
    return (
      <SmsRedirectPage
        client={client}
        campaign={campaign}
        creative={creative}
        smsPhone={smsPhone}
        smsMessage={smsMessage}
      />
    );
  }

  // Mobile → SMS screen | Desktop with Messenger → Messenger screen
  const channel = isMobile === false ? "messenger" : "sms";

  return (
    <SmsRedirectScreen
      clientName={client.clientName}
      logoUrl={client.logoUrl}
      smsUrl={redirectUrl}
      smsPhone={smsPhone}
      statusText={statusText}
      channel={channel}
    />
  );
}
